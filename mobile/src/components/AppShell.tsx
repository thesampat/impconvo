import { useEffect, useRef, useState, type ComponentType } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BanterScreen from '../screens/BanterScreen';
import MisinterpretScreen from '../screens/MisinterpretScreen';
import OpenersScreen from '../screens/OpenersScreen';
import { SCREENS, type ScreenId } from '../screens/types';
import { IS_ADMIN_BUILD } from '../appVariant';
import { useSettings } from '../state/SettingsContext';
import { makeStyles } from '../theme';
import AdminUnlockDialog from './AdminUnlockDialog';
import Drawer from './Drawer';
import ScreenInfoSheet from './ScreenInfoSheet';
import SettingsDialog, { type AdminSection } from './SettingsDialog';
import TopBar from './TopBar';

const SCREEN_COMPONENTS: Record<ScreenId, ComponentType> = {
  openers: OpenersScreen,
  misinterpret: MisinterpretScreen,
  banter: BanterScreen,
};

export default function AppShell() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { isConnected, testConnection, isAdmin } = useSettings();
  const [current, setCurrent] = useState<ScreenId>('banter');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [adminSection, setAdminSection] = useState<AdminSection>('usage');
  const openAdmin = (section: AdminSection) => {
    setAdminSection(section);
    setShowSettings(true);
  };
  const [showUnlock, setShowUnlock] = useState(false);
  // Opened only after the drawer Modal has fully closed (iOS can't present two Modals at once)
  const afterDrawerClose = useRef<(() => void) | null>(null);

  // Hardware back on a secondary screen returns to Watch & Learn; Modals handle their own back via onRequestClose
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (current !== 'banter') {
        setCurrent('banter');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [current]);

  // Admin access can drop (Lock admin, expired session); never leave the admin dialog pending
  useEffect(() => {
    if (!isAdmin) setShowSettings(false);
  }, [isAdmin]);

  const title = SCREENS.find((s) => s.id === current)?.title ?? '';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TopBar
        title={title}
        isConnected={isConnected}
        isAdmin={isAdmin}
        onMenu={() => setDrawerOpen(true)}
        onRetest={testConnection}
        onInfo={() => setShowInfo(true)}
        onSettings={() => openAdmin('usage')}
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
        onAdmin={(section) => {
          // Admin app only: ask for the code the first time, then open the panel
          const admin = isAdmin;
          afterDrawerClose.current = () => (admin ? openAdmin(section) : setShowUnlock(true));
          setDrawerOpen(false);
        }}
        onClosed={() => {
          afterDrawerClose.current?.();
          afterDrawerClose.current = null;
        }}
      />
      <ScreenInfoSheet visible={showInfo} screen={current} onClose={() => setShowInfo(false)} />
      {IS_ADMIN_BUILD && (
        <>
          <SettingsDialog visible={showSettings} section={adminSection} onClose={() => setShowSettings(false)} />
          <AdminUnlockDialog
            visible={showUnlock}
            onClose={() => setShowUnlock(false)}
            onUnlocked={() => {
              setShowUnlock(false);
              // Straight into the panel; wait for the unlock Modal to close first (iOS can't stack them)
              setTimeout(() => openAdmin('usage'), 350);
            }}
          />
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((c, t) => ({
  root: { flex: 1, backgroundColor: c.background },
  content: { flex: 1 },
  screen: { flex: 1 },
  hidden: { display: 'none' },
}));
