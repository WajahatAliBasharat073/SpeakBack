import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';

const logoImg = require('./assets/logo.png');
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Mic, StopCircle, Play, Activity, Users, Newspaper, Info, ArrowLeft } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, FadeInUp } from 'react-native-reanimated';
import CaregiverDashboard from './components/CaregiverDashboard';
import Waveform from './components/Waveform';
import AACBar from './components/AACBar';
import NewsReader from './components/NewsReader';
import AuthFlow from './components/AuthFlow';

const { width } = Dimensions.get('window');
import { Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// Use 10.0.2.2 for Android Emulator, localhost for others
const BACKEND_URL = Platform.OS === 'android'
  ? 'ws://10.0.2.2:8000/ws'
  : 'ws://192.168.100.4:8000/ws'; // Use local IP for iOS devices

export default function App() {
  const [mode, setMode] = useState<'patient' | 'caregiver'>('patient');
  const [status, setStatus] = useState('Ready to help');
  const [isLive, setIsLive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [targetTask, setTargetTask] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [showNews, setShowNews] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingInterval = useRef<any>(null);

  const ws = useRef<WebSocket | null>(null);
  const cameraRef = useRef<any>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();

  useEffect(() => {
    // Simulated Splash Screen
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        // Fetch profile info
        setLoadingProfile(true);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      requestCameraPermission();
      requestAudioPermission();
    }
  }, [isAuthenticated]);

  // LIVE Pulse Animation
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isLive) {
      pulse.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1, true);
    } else {
      pulse.value = 1;
    }
  }, [isLive]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: isLive ? 1 : 0.5,
  }));

  // Audio Recording Setup for Gemini Live
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      recordingRef.current = newRecording;

      // Chunking logic: record for 1s, send, repeat
      recordingInterval.current = setInterval(async () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN && recordingRef.current) {
          try {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording) {
              const uri = recordingRef.current.getURI();
              if (uri) {
                const base64Audio = await FileSystem.readAsStringAsync(uri, {
                  encoding: 'base64' as any,
                });
                ws.current.send(JSON.stringify({
                  type: 'realtime_input',
                  data: base64Audio,
                  end_of_turn: false
                }));
              }
            }
          } catch (e) {
            console.error("Recording chunk error:", e);
          }
        }
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setRecording(null);
    if (recordingInterval.current) clearInterval(recordingInterval.current);
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        console.error("Error stopping recording:", e);
      } finally {
        recordingRef.current = null;
      }
    }
  };

  const startSession = async () => {
    try {
      setIsLive(true);
      setStatus('Connecting...');
      await startRecording();

      const queryParams = new URLSearchParams({
        user_id: 'test-user',
        session_id: `session-${Date.now()}`,
        name: userProfile?.name || 'Patient',
        lang: userProfile?.language || 'English',
        interests: userProfile?.interests || 'General'
      });

      ws.current = new WebSocket(`${BACKEND_URL}?${queryParams.toString()}`);

      ws.current.onopen = () => setStatus('Session Started');
      ws.current.onmessage = async (e) => {
        const message = JSON.parse(e.data);
        if (message.type === 'audio') {
          console.log(`[WS] Received Audio chunk: ${message.data.length} chars`);
          setIsSpeaking(true);
          try {
            // Write chunk to temp file for more reliable playback on iOS
            const tempFile = `${FileSystem.cacheDirectory}voice_chunk_${Date.now()}.wav`;
            await FileSystem.writeAsStringAsync(tempFile, message.data, {
              encoding: 'base64' as any,
            });

            const { sound } = await Audio.Sound.createAsync(
              { uri: tempFile },
              { shouldPlay: true }
            );

            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                console.log("[Audio] Finished playing chunk");
                setIsSpeaking(false);
                sound.unloadAsync();
                FileSystem.deleteAsync(tempFile, { idempotent: true });
              }
            });
          } catch (err) {
            console.error("[Audio] Playback error:", err);
            setIsSpeaking(false);
          }
        } else if (message.type === 'show_task') {
          setTargetTask(message.data);
        } else if (message.text) {
          setStatus(message.text);
        }
      };

      // Vision streaming setup (Frame capture every 3s if naming/practice)
      if (activeModule === 'practice' || activeModule === 'naming') {
        const frameInterval = setInterval(async () => {
          if (cameraRef.current && ws.current && ws.current.readyState === WebSocket.OPEN) {
            try {
              const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
              if (photo.base64) {
                ws.current.send(JSON.stringify({
                  type: 'realtime_input',
                  data: photo.base64,
                  mime_type: 'image/jpeg'
                }));
              }
            } catch (e) {
              console.error("Frame capture error:", e);
            }
          }
        }, 3000);

        // Store interval to clear it on stop
        (ws.current as any).frameInterval = frameInterval;
      }

      setStatus('System Active');
    } catch (err) {
      setStatus('Error connecting');
      setIsLive(false);
    }
  };

  const stopSession = () => {
    setIsLive(false);
    setStatus('Ready to help');
    stopRecording();
    if (ws.current) {
      if ((ws.current as any).frameInterval) clearInterval((ws.current as any).frameInterval);
      ws.current.close();
    }
    setTargetTask(null);
  };

  const renderModuleDashboard = () => (
    <View style={styles.dashboardGrid}>
      <Text style={styles.dashboardTitle}>Choose Exercise</Text>
      <View style={styles.gridRow}>
        <TouchableOpacity style={styles.moduleCard} onPress={() => setActiveModule('practice')}>
          <View style={[styles.moduleIcon, { backgroundColor: '#3b9eff' }]}>
            <Mic color="#fff" size={32} />
          </View>
          <Text style={styles.moduleLabel}>Daily Practice</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moduleCard} onPress={() => setActiveModule('news')}>
          <View style={[styles.moduleIcon, { backgroundColor: '#2dcc8f' }]}>
            <Newspaper color="#fff" size={32} />
          </View>
          <Text style={styles.moduleLabel}>AI News</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.gridRow}>
        <TouchableOpacity style={styles.moduleCard} onPress={() => setActiveModule('naming')}>
          <View style={[styles.moduleIcon, { backgroundColor: '#ff9f43' }]}>
            <Activity color="#fff" size={32} />
          </View>
          <Text style={styles.moduleLabel}>Naming Clinic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moduleCard} onPress={() => setActiveModule('aac')}>
          <View style={[styles.moduleIcon, { backgroundColor: '#ff5b5b' }]}>
            <Users color="#fff" size={32} />
          </View>
          <Text style={styles.moduleLabel}>Needs Bar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.gridRow}>
        <TouchableOpacity style={styles.moduleCard} onPress={() => setActiveModule('logic')}>
          <View style={[styles.moduleIcon, { backgroundColor: '#a55eea' }]}>
            <Info color="#fff" size={32} />
          </View>
          <Text style={styles.moduleLabel}>Logic Games</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moduleCard} onPress={() => setMode('caregiver')}>
          <View style={[styles.moduleIcon, { backgroundColor: '#4b7bec' }]}>
            <Users color="#fff" size={32} />
          </View>
          <Text style={styles.moduleLabel}>Caregiver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showSplash) {
    return (
      <View style={[styles.container, styles.splashContainer]}>
        <Image
          source={logoImg}
          style={styles.logoImageLarge}
          resizeMode="contain"
        />
        <Text style={styles.brandLarge}>SpeakBack</Text>
        <Text style={styles.subtextLarge}>Empowering Every Voice</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthFlow onAuthSuccess={(user) => setIsAuthenticated(true)} />;
  }

  if (loadingProfile) {
    return (
      <View style={[styles.container, styles.splashContainer]}>
        <ActivityIndicator size="large" color="#3b9eff" />
        <Text style={styles.subtextLarge}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>SpeakBack</Text>
          <Text style={styles.subtext}>Gentle Therapy AI</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerBtn, showNews && styles.headerBtnActive]}
            onPress={() => setShowNews(!showNews)}
          >
            <Newspaper color={showNews ? '#fff' : '#6b8099'} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, mode === 'caregiver' && styles.headerBtnActive]}
            onPress={() => setMode(mode === 'patient' ? 'caregiver' : 'patient')}
          >
            <Users color={mode === 'caregiver' ? '#fff' : '#6b8099'} size={24} />
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <Animated.View style={[styles.pulseDot, animatedPulseStyle]} />
            <Text style={styles.statusText}>{status.length > 20 ? status.slice(0, 17) + '...' : status}</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {mode === 'caregiver' ? (
          <CaregiverDashboard onBack={() => setMode('patient')} />
        ) : !activeModule ? (
          renderModuleDashboard()
        ) : activeModule === 'practice' ? (
          <View style={styles.liveWrapper}>
            <View style={styles.cameraContainer}>
              <CameraView ref={cameraRef} style={styles.camera} facing="front" />
              {isSpeaking && <Waveform />}
            </View>

            {targetTask && (
              <Animated.View entering={FadeInUp} style={styles.taskCard}>
                <Text style={styles.taskLabel}>CAN YOU NAME THIS?</Text>
                <View style={styles.imageBox}>
                  <Text style={styles.emoji}>
                    {targetTask === 'apple' ? '🍎' :
                      targetTask === 'car' ? '🚗' :
                        targetTask === 'dog' ? '🐶' : '📦'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setTargetTask(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>I DONE IT!</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <AACBar onPress={(need) => {
              if (ws.current) ws.current.send(JSON.stringify({ type: 'emergency_need', data: need }));
            }} />
          </View>
        ) : activeModule === 'news' ? (
          <NewsReader items={[]} />
        ) : activeModule === 'naming' ? (
          <View style={styles.liveWrapper}>
            <View style={styles.cameraContainer}>
              <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            </View>
            <TouchableOpacity style={styles.backToMenu} onPress={() => setActiveModule(null)}>
              <ArrowLeft color="#fff" size={24} />
              <Text style={styles.backText}>Return to Exercises</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Coming Soon</Text>
            <TouchableOpacity style={styles.backToMenu} onPress={() => setActiveModule(null)}>
              <Text style={styles.backText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {!activeModule ? null : (
          !isLive ? (
            <TouchableOpacity style={styles.actionMain} onPress={startSession}>
              <Play color="#fff" size={32} />
              <Text style={styles.actionText}>TAP TO START</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.liveFooter}>
              <TouchableOpacity style={[styles.actionMain, styles.actionSpeak]} onPress={() => {
                if (ws.current) ws.current.send(JSON.stringify({ type: 'manual_end_turn' }));
              }}>
                <Mic color="#fff" size={32} />
                <Text style={styles.actionText}>I WANT TO SPEAK</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionMain, styles.actionEnd]} onPress={stopSession}>
                <StopCircle color="#fff" size={32} />
                <Text style={styles.actionText}>END SESSION</Text>
              </TouchableOpacity>
            </View>
          )
        )}
        {activeModule && !isLive && (
          <TouchableOpacity style={[styles.backToMenu, { marginTop: 10 }]} onPress={() => setActiveModule(null)}>
            <Text style={styles.backText}>Main Menu</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07090f' },
  logoImageLarge: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  splashContainer: { justifyContent: 'center', alignItems: 'center' },
  logoCircleLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#3b9eff', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b9eff', shadowOpacity: 0.5, shadowRadius: 30, elevation: 15 },
  logoTextLarge: { color: '#fff', fontSize: 48, fontWeight: '900' },
  brandLarge: { fontSize: 44, fontWeight: '900', color: '#fff', marginTop: 20, letterSpacing: -2 },
  subtextLarge: { fontSize: 18, color: '#6b8099', marginTop: 10, fontWeight: '600' },
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  subtext: { fontSize: 12, color: '#6b8099', fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a1d29', alignItems: 'center', justifyContent: 'center' },
  headerBtnActive: { backgroundColor: '#3b9eff' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d29', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b9eff', marginRight: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  content: { padding: 24, flexGrow: 1 },
  heroBase: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: 40 },
  heroIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#3b9eff', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center' },
  heroSub: { fontSize: 20, color: '#6b8099', textAlign: 'center', marginTop: 8 },
  tipsContainer: { marginTop: 40, width: '100%', backgroundColor: '#1a1d29', padding: 20, borderRadius: 24 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  liveWrapper: { flex: 1, gap: 24 },
  cameraContainer: { height: 350, backgroundColor: '#000', borderRadius: 32, overflow: 'hidden', borderStyle: 'solid', borderWidth: 2, borderColor: '#3b9eff' },
  camera: { flex: 1 },
  cameraPlaceholder: { height: 350, backgroundColor: '#1a1d29', borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#3b9eff' },
  placeholderText: { color: '#3b9eff', fontSize: 16, fontWeight: '700', marginTop: 16 },
  taskCard: { backgroundColor: '#fff', borderRadius: 32, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  taskLabel: { fontSize: 14, fontWeight: '800', color: '#6b8099', marginBottom: 20 },
  imageBox: { width: 160, height: 160, backgroundColor: '#f0f4f8', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emoji: { fontSize: 80 },
  closeBtn: { backgroundColor: '#3b9eff', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 20 },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#1a1d29' },
  actionMain: { backgroundColor: '#3b9eff', height: 80, borderRadius: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  actionText: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  liveFooter: { gap: 16 },
  actionSpeak: { backgroundColor: '#2dcc8f' },
  actionEnd: { backgroundColor: '#ff5b5b' },
  dashboardGrid: { paddingVertical: 20 },
  dashboardTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24, textAlign: 'center' },
  gridRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  moduleCard: { flex: 1, backgroundColor: '#1a1d29', borderRadius: 24, padding: 24, alignItems: 'center', justifyContent: 'center' },
  moduleIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  moduleLabel: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  backToMenu: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  backText: { color: '#6b8099', fontSize: 16, fontWeight: '700' }
});
