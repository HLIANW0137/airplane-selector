# 天空纪 - 全球飞机选购平台

一个仿懂车帝风格的飞机选购网站，涵盖民航客机、公务机、军用飞机、货运飞机、直升机、通用航空、支线客机等全部类型，支持多维度参数筛选、飞机对比、用户提交补全等功能。

## 功能特性

### 选飞机页面 (index.html)
- **分类浏览**：7大飞机类别快速切换
- **多维度筛选**：品牌、价格、发动机数量/类型、座位数、航程、速度、产地、生产状态
- **智能搜索**：支持按名称、型号、描述模糊搜索
- **多种排序**：默认、价格升降序、航程、速度、座位数排序
- **飞机对比**：最多3款飞机同时对比
- **详情弹窗**：点击飞机卡片查看完整参数，支持图片轮播
- **补全入口**：每架飞机详情页底部可直接跳转到补全信息页面

### 用户中心 (submit.html)
- **用户系统**：随机ID + 昵称，localStorage持久化
- **提交飞机数据**：填写完整参数提交新飞机
- **撤回功能**：待审核提交可撤回
- **草稿管理**：撤回后自动保存为草稿（最多2份，3天过期）
- **补全信息**：选择现有飞机，只填写需要修改的字段
- **留言系统**：给开发者留言，仅管理员可见并可回复

### 数据管理后台 (admin.html)
- **密码保护**：需要密码登录（默认：skyera2026）
- **飞机数据管理**：添加、编辑、删除飞机信息
- **图片管理**：支持本地上传和URL添加图片
- **审核功能**：审核用户提交的新飞机数据
- **补全审核**：审核用户补全的信息，通过后自动合并到现有数据
- **留言管理**：查看和回复用户留言
- **数据导入导出**：JSON格式一键导入导出

### 法律合规
- **隐私政策** (privacy.html)：数据收集和使用说明
- **免责声明** (terms.html)：数据准确性声明和使用条款
- **SEO优化**：完整的meta标签和Open Graph支持

## 项目结构

```
airplane-selector/
├── index.html          # 主页面 - 选飞机界面
├── submit.html         # 用户中心
├── admin.html          # 数据管理后台
├── privacy.html        # 隐私政策
├── terms.html          # 免责声明
├── 404.html            # 404错误页面
├── database.sql        # Supabase数据库表结构
├── README.md           # 项目说明文档
├── css/
│   ├── style.css       # 主页面样式
│   ├── user.css        # 用户中心样式
│   ├── admin.css       # 后台管理样式
│   └── legal.css       # 法律页面样式
├── js/
│   ├── config.js       # Supabase配置
│   ├── db.js           # 数据存储层（支持Supabase和localStorage）
│   ├── app.js          # 主页面逻辑
│   ├── user.js         # 用户中心逻辑
│   └── admin.js        # 后台管理逻辑
└── data/
    └── airplanes.json  # 飞机数据文件
```

## 快速开始

### 方式一：本地使用（无需后端）
1. 使用本地服务器打开项目
2. 数据存储在浏览器localStorage中
3. 适合个人使用或测试

```bash
cd airplane-selector
python -m http.server 8080
# 或
npx http-server -p 8080
```

### 方式二：接入Supabase（推荐生产环境）
1. 访问 [supabase.com](https://supabase.com) 注册账号
2. 创建新项目
3. 在SQL Editor中执行 `database.sql` 创建表结构
4. 编辑 `js/config.js`，填入你的Supabase配置：
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   const USE_SUPABASE = true;
   ```
5. 部署到Vercel、Netlify或任何静态托管服务

## 数据存储说明

### localStorage模式（默认）
- 用户数据、提交记录、留言等存储在浏览器本地
- 优点：无需后端，开箱即用
- 缺点：数据不共享，清除浏览器数据会丢失

### Supabase模式
- 所有用户数据存储在Supabase云端数据库
- 优点：数据持久化，多用户共享，可扩展
- 缺点：需要注册Supabase账号

## 预置数据

当前包含 **207款** 各类型飞机数据，覆盖：

| 类型 | 数量 | 代表机型 |
|------|------|----------|
| 民航客机 | 40+ | 波音737/747/777/787, 空客A320/A330/A350/A380, C919 |
| 公务机 | 10+ | 湾流G700/G650ER, 达索猎鹰8X, 庞巴迪环球7500 |
| 军用飞机 | 60+ | F-22, F-35, 歼-20, 苏-57, B-2, 轰-6 |
| 货运飞机 | 10+ | 运-20, 安-225, 波音747-8F, 伊尔-76 |
| 直升机 | 40+ | AH-64, UH-60黑鹰, 米-26, 直-20 |
| 通用航空 | 15+ | 赛斯纳172, SR22, 皮拉图斯PC-12 |
| 支线客机 | 20+ | ARJ21, E190, ATR72, Dash8 |

## 技术栈

- **前端**：原生 HTML5 + CSS3 + JavaScript (ES6+)
- **样式**：CSS Grid + Flexbox 响应式布局
- **数据存储**：localStorage / Supabase
- **外部依赖**：Supabase JS SDK（仅Supabase模式需要）

## 浏览器兼容性

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 部署指南

### Vercel部署（推荐）
1. Fork或上传项目到GitHub
2. 登录 [vercel.com](https://vercel.com)
3. Import项目，选择Framework Preset为"Other"
4. 部署完成

### Netlify部署
1. 登录 [netlify.com](https://netlify.com)
2. 拖拽项目文件夹到部署区域
3. 配置自定义域名（可选）

### 传统服务器部署
```bash
# 安装Nginx
apt install nginx -y

# 上传文件
cp -r airplane-selector/* /var/www/html/

# 配置Nginx（添加404页面支持）
# 在nginx.conf中添加：
# error_page 404 /404.html;

# 重启Nginx
systemctl restart nginx
```

## 注意事项

1. **数据仅供参考**：飞机参数和价格为公开数据，可能与实际有差异
2. **密码安全**：管理后台密码为前端验证，生产环境建议使用Nginx auth_basic
3. **ICP备案**：国内服务器需要备案才能绑定域名
4. **图片存储**：当前使用base64存储在localStorage，生产环境建议使用对象存储

## License

MIT