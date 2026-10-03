import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Breadcrumbs,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CloudQueueOutlined,
  DashboardOutlined,
  HistoryOutlined,
  Inventory2Outlined,
  Logout,
  Menu as MenuIcon,
  SettingsOutlined,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 76;

const USER_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardOutlined },
  { label: 'Products', path: '/products', icon: Inventory2Outlined },
  { label: 'Provisioning', path: '/provisioning', icon: CloudQueueOutlined },
  { label: 'Provisioning History', path: '/history', icon: HistoryOutlined },
  { label: 'Settings', path: '/settings', icon: SettingsOutlined },
];

const ADMIN_NAV_ITEMS = [
  { label: 'Admin Dashboard', path: '/admin/dashboard', icon: DashboardOutlined },
];

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  );
}

function isSelected(pathname, path) {
  if (path === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

function crumbsFor(pathname, navItems) {
  if (pathname.startsWith('/admin')) {
    return [{ label: 'Admin Dashboard' }];
  }

  if (pathname.startsWith('/products/') && pathname !== '/products') {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Products', to: '/products' },
      { label: 'Details' },
    ];
  }

  if (pathname.startsWith('/history/') && pathname !== '/history') {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Provisioning History', to: '/history' },
      { label: 'Status' },
    ];
  }

  if (pathname.startsWith('/provisioning/') && pathname !== '/provisioning') {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Provisioning' },
    ];
  }

  const current = navItems.find((item) => item.path === pathname);
  if (!current || current.path === '/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  return [
    { label: 'Dashboard', to: '/dashboard' },
    { label: current.label },
  ];
}

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { user, logout, mode } = useAuth();
  const navItems = user?.role === 'Admin' ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const desktopWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  const crumbs = crumbsFor(location.pathname, navItems);

  function handleMenuToggle() {
    if (isMobile) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((current) => !current);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  const drawer = (compact) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: compact ? 1 : 2, gap: 1 }}>
        <CloudQueueOutlined />
        {!compact && (
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
            Catalog Portal
          </Typography>
        )}
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <List component="nav" aria-label="Main" sx={{ px: 1, py: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = isSelected(location.pathname, item.path);
          const button = (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={selected}
              onClick={closeMobile}
              sx={{
                mb: 0.5,
                borderRadius: 1.5,
                justifyContent: compact ? 'center' : 'flex-start',
                color: 'inherit',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.14)',
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: compact ? 0 : 40,
                  justifyContent: 'center',
                }}
              >
                <Icon fontSize="small" />
              </ListItemIcon>
              {!compact && <ListItemText primary={item.label} />}
            </ListItemButton>
          );

          if (!compact) {
            return button;
          }

          return (
            <Tooltip key={item.path} title={item.label} placement="right">
              {button}
            </Tooltip>
          );
        })}
      </List>
      {!compact && (
        <Typography variant="caption" sx={{ px: 2, pb: 2, opacity: 0.75 }}>
          {mode === 'aws' ? 'AWS Service Catalog' : 'Demo Mode'}
        </Typography>
      )}
    </Box>
  );

  const paperSx = {
    boxSizing: 'border-box',
    color: '#f4f7f8',
    bgcolor: '#16303d',
    borderRight: 'none',
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${desktopWidth}px)` },
          ml: { md: `${desktopWidth}px` },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            aria-label={
              isMobile
                ? mobileOpen
                  ? 'Close navigation'
                  : 'Open navigation'
                : collapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
            }
            onClick={handleMenuToggle}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, mr: 2 }}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              AWS Service Catalog
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              Catalog
            </Box>
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}>
            {crumbs.map((crumb) =>
              crumb.to ? (
                <Typography
                  key={crumb.label}
                  component={RouterLink}
                  to={crumb.to}
                  variant="body2"
                  sx={{ color: 'text.secondary', textDecoration: 'none' }}
                >
                  {crumb.label}
                </Typography>
              ) : (
                <Typography key={crumb.label} variant="body2" color="text.primary">
                  {crumb.label}
                </Typography>
              ),
            )}
          </Breadcrumbs>
          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />
          <Chip
            label={mode === 'aws' ? 'AWS Connected' : 'Demo Mode'}
            size="small"
            variant="outlined"
            color={mode === 'aws' ? 'success' : 'warning'}
            sx={{ mr: 1 }}
          />
          <IconButton
            aria-label="Open account menu"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {initials(user?.name)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled sx={{ opacity: '1 !important', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  {user?.role}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                logout();
              }}
            >
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" aria-label="Portal sections">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { ...paperSx, width: EXPANDED_WIDTH },
          }}
        >
          {drawer(false)}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: desktopWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': { ...paperSx, width: desktopWidth, overflowX: 'hidden' },
          }}
        >
          {drawer(collapsed)}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, md: 3 },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
