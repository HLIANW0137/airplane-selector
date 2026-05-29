/**
 * Supabase 配置
 */

const SUPABASE_URL = 'https://wnweaursjagkfjlxgvpu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__xgQRH2ue8FX8KzBokemGQ_h1B3ONga';

// 是否启用 Supabase（设为 false 则使用 localStorage）
const USE_SUPABASE = true;

// 导出配置
window.SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  enabled: USE_SUPABASE
};