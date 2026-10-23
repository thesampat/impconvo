import { useEffect, useRef, useState, type ComponentType } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BanterScreen from '../screens/BanterScreen';
import ChatScreen from '../screens/ChatScreen';
import MisinterpretScreen from '../screens/MisinterpretScreen';
import OpenersScreen from '../screens/OpenersScreen';
import { SCREENS, type ScreenId } from '../screens/types';
import { useSettings } from '../state/SettingsContext';
import Drawer from './Drawer';
import ScreenInfoSheet from './ScreenInfoSheet';
import SettingsDialog from './SettingsDialog';
import TopBar from './TopBar';

const SCREEN_COMPONENTS: Record<ScreenId, ComponentType> = {
  chat: ChatScreen,
  openers: OpenersScreen,
  misinterpret: MisinterpretScreen,
  banter: BanterScreen,
};

export default function AppShell() {
  const insets = useSafeAreaInsets();
  const { isConnected, testConnection } = useSettings();
  const [current, setCurrent] = useState<ScreenId>('chat');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Opened only after the drawer Modal has fully closed (iOS can't present two Modals at once)
  const afterDrawerClose = useRef<(() => void) | null>(null);

  // Hardware back on a secondary screen returns to chat; Modals handle their own back via onRequestClose
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (current !== 'chat') {
        setCurrent('chat');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [current]);

  const title = SCREENS.find((s) => s.id === current)?.title ?? '';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TopBar
        title={title}
        isConnected={isConnected}
        onMenu={() => setDrawerOpen(true)}
        onRetest={testConnection}
        onInfo={() => setShowInfo(true)}
        onSettings={() => setShowSettings(true)}
      />

      {/* All screens stay mounted so each keeps its state while hidden */}
      <View style={styles.content}>
        {SCREENS.map(({ id }) => {
          const Screen = SCREEN_COMPONENTS[id];
          return (
            <View key={id} style={[styles.screen, id !== current && styles.hidden]}>
              <Screen />
            </View>
          );
        })}
      </View>

      <Drawer
        open={drawerOpen}
        current={current}
        onClose={() => setDrawerOpen(false)}
        onSelect={(id) => {
          setCurrent(id);
          setDrawerOpen(false);
        }}
        onGuide={() => {
          afterDrawerClose.current = () => setShowInfo(true);
          setDrawerOpen(false);
        }}
        onSettings={() => {
          afterDrawerClose.current = () => setShowSettings(true);
          setDrawerOpen(false);
        }}
        onClosed={() => {
          afterDrawerClose.current?.();
          afterDrawerClose.current = null;
        }}
      />
      <ScreenInfoSheet visible={showInfo} screen={current} onClose={() => setShowInfo(false)} />
      <SettingsDialog visible={showSettings} onClose={() => setShowSettings(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  screen: { flex: 1 },
  hidden: { display: 'none' },
});
