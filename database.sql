-- 天空纪 Supabase 数据库表结构
-- 在 Supabase 控制台的 SQL Editor 中执行此文件

-- 1. 提交记录表（新飞机提交 + 撤回）
CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_nickname TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'new',  -- 'new' 或 'supplement'
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'withdrawn'
  data JSONB,  -- 飞机数据（新飞机提交时使用）
  airplane_id BIGINT,  -- 补全时的目标飞机ID
  airplane_name TEXT,
  changes JSONB,  -- 补全的变更内容
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);

-- 2. 留言表
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- 3. 草稿表
CREATE TABLE IF NOT EXISTS drafts (
  id BIGINT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);

-- 4. 补全记录表（独立于 submissions，便于查询）
CREATE TABLE IF NOT EXISTS supplements (
  id BIGINT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_nickname TEXT NOT NULL,
  airplane_id BIGINT NOT NULL,
  airplane_name TEXT NOT NULL,
  changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_supplements_user_id ON supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_supplements_airplane_id ON supplements(airplane_id);
CREATE INDEX IF NOT EXISTS idx_supplements_status ON supplements(status);

-- 5. 启用行级安全（RLS）
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

-- 6. 创建策略（允许匿名读取，需要认证才能写入）
-- 注意：当前使用 anon key，策略设置为允许所有操作
-- 生产环境应改为更严格的策略

CREATE POLICY "Allow all operations on submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on drafts" ON drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on supplements" ON supplements FOR ALL USING (true) WITH CHECK (true);

-- 完成！