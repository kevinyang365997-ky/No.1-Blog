# 抖音与 TikTok 视频同步

该任务每小时检查一次已授权抖音账号的新公开视频，并在 TikTok 已授权账号中按标题和发布时间寻找对应视频。只有找到对应 TikTok 视频和封面时，才会创建博客视频条目；TikTok 的临时封面会被下载到仓库，避免链接过期。

## 启用前需要的授权

请勿把任何密钥或 Token 写入文件或发送到聊天中。全部凭证应保存到 GitHub 仓库的 **Settings → Secrets and variables → Actions**。

### 抖音开放平台

创建网站应用并申请“内容运营-视频信息数据/查询授权账号视频列表”能力，让目标抖音账号完成 OAuth 授权。添加以下 Repository secrets：

- `DOUYIN_ACCESS_TOKEN`
- `DOUYIN_OPEN_ID`
- `DOUYIN_CLIENT_KEY`

如果控制台提供的视频列表地址与默认地址不同，再添加 `DOUYIN_VIDEO_LIST_ENDPOINT` 并同步修改工作流环境变量。

### TikTok for Developers

创建应用，启用 Login Kit 和 Display API，申请 `user.info.basic`、`video.list`，让 `@kevinthtautomation` 完成 OAuth 授权。添加：

- `TIKTOK_ACCESS_TOKEN`

TikTok access token 当前有效期较短。正式长期自动运行前，需要增加安全的 refresh-token 存储服务；不要把 refresh token 提交到仓库。当前工作流在 Token 失效时会失败并停止写入，不会生成错误内容。

### 开启任务

确认所有 Secrets 已添加后，在 Repository variables 中添加：

- `SOCIAL_VIDEO_SYNC_ENABLED` = `true`

然后进入 **Actions → Sync Douyin videos → Run workflow** 手动运行一次。成功后，定时任务会在每小时第 17 分钟运行。

## 匹配规则

- 发布时间相差不超过 96 小时；
- 标题关键词相似度不低于 0.45；
- 没有匹配 TikTok 视频时跳过，不使用错误封面；
- 已写入 Markdown 的 `douyin_video_id` 用于永久去重。

可以在 `social-video-sync.config.json` 中调整时间窗口和标题相似度。
