'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Box, IconButton, Divider, Chip
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Business, Inventory, ShoppingCart,
  PointOfSale, Warehouse, Description, BarChart, Logout
} from '@mui/icons-material';
import { useAuth } from '@/lib/AuthContext';

const DRAWER_WIDTH = 260;

const menuItems = [
  { label: 'Дашборд', icon: <Dashboard />, href: '/dashboard' },
  { label: 'Поставщики', icon: <Business />, href: '/suppliers' },
  { label: 'Товары', icon: <Inventory />, href: '/products' },
  { label: 'Закупки', icon: <ShoppingCart />, href: '/purchases' },
  { label: 'Продажи', icon: <PointOfSale />, href: '/sales' },
  { label: 'Склад', icon: <Warehouse />, href: '/inventory' },
  { label: 'Документы', icon: <Description />, href: '/documents' },
  { label: 'Аналитика', icon: <BarChart />, href: '/analytics' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const roleLabels: Record<string, string> = { ADMIN: 'Админ', MANAGER: 'Менеджер', VIEWER: 'Наблюдатель' };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Viasglobal CRM
        </Typography>
        <Chip label={roleLabels[user?.role || ''] || user?.role} size="small" sx={{ mt: 0.5 }} />
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.href}
            selected={pathname === item.href}
            onClick={() => { router.push(item.href); setMobileOpen(false); }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItemButton onClick={logout}>
          <ListItemIcon><Logout /></ListItemIcon>
          <ListItemText primary="Выйти" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap flex={1}>{menuItems.find(m => m.href === pathname)?.label || 'CRM'}</Typography>
          <Typography variant="body2">{user?.name}</Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        {children}
      </Box>
    </Box>
  );
}