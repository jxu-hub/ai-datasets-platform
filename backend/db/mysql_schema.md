# MySQL 数据库结构设计

本文档定义了AI数据集平台的MySQL关系型数据库结构，用于存储核心业务数据。

## 1. 用户管理表

### users (用户表)
\`\`\`sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户唯一标识',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名，唯一',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱地址，唯一',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希值',
    role ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer' COMMENT '用户角色：买家/卖家/管理员',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    reputation_score DECIMAL(3,2) DEFAULT 0.00 COMMENT '信誉评分 0-5.00',
    total_uploads INT DEFAULT 0 COMMENT '总上传数据集数量',
    total_downloads INT DEFAULT 0 COMMENT '总下载数据集数量',
    is_active BOOLEAN DEFAULT TRUE COMMENT '账户是否激活',
    email_verified BOOLEAN DEFAULT FALSE COMMENT '邮箱是否已验证',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) COMMENT='用户基础信息表';
\`\`\`

### user_wallets (用户钱包表)
\`\`\`sql
CREATE TABLE user_wallets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '钱包记录唯一标识',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    wallet_address VARCHAR(42) NOT NULL UNIQUE COMMENT '钱包地址，以太坊地址格式',
    is_bound BOOLEAN DEFAULT TRUE COMMENT '是否已绑定',
    bound_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_bound_at (bound_at)
) COMMENT='用户钱包绑定表';
\`\`\`

### wallet_change_requests (钱包更换申请表)
\`\`\`sql
CREATE TABLE wallet_change_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '申请记录唯一标识',
    user_id BIGINT NOT NULL COMMENT '申请用户ID',
    current_wallet_address VARCHAR(42) NOT NULL COMMENT '当前钱包地址',
    new_wallet_address VARCHAR(42) NOT NULL COMMENT '新钱包地址',
    reason TEXT COMMENT '更换原因',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '申请状态',
    admin_reason TEXT COMMENT '管理员审核意见',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    reviewed_at TIMESTAMP NULL COMMENT '审核时间',
    reviewed_by BIGINT NULL COMMENT '审核管理员ID',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) COMMENT='钱包地址更换申请表';
\`\`\`

## 2. 数据集管理表

### datasets (数据集表)
\`\`\`sql
CREATE TABLE datasets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '数据集唯一标识',
    title VARCHAR(200) NOT NULL COMMENT '数据集标题',
    description TEXT COMMENT '数据集描述',
    category VARCHAR(50) NOT NULL COMMENT '数据集分类',
    tags JSON COMMENT '标签数组，JSON格式存储',
    price DECIMAL(10,2) DEFAULT 0.00 COMMENT '价格，0表示免费',
    is_free BOOLEAN GENERATED ALWAYS AS (price = 0) STORED COMMENT '是否免费，根据价格自动计算',
    file_url VARCHAR(500) NOT NULL COMMENT '文件存储URL',
    file_size BIGINT NOT NULL COMMENT '文件大小，单位字节',
    file_format VARCHAR(20) NOT NULL COMMENT '文件格式：json/csv/jsonl等',
    preview_data JSON COMMENT '预览数据，JSON格式',
    author_id BIGINT NOT NULL COMMENT '作者用户ID',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分 0-5.00',
    rating_count INT DEFAULT 0 COMMENT '评分人数',
    status ENUM('active', 'inactive', 'under_review') DEFAULT 'under_review' COMMENT '数据集状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_author_id (author_id),
    INDEX idx_category (category),
    INDEX idx_price (price),
    INDEX idx_is_free (is_free),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_download_count (download_count),
    INDEX idx_rating (rating),
    FULLTEXT idx_title_description (title, description)
) COMMENT='数据集基础信息表';
\`\`\`

### dataset_purchases (数据集购买记录表)
\`\`\`sql
CREATE TABLE dataset_purchases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '购买记录唯一标识',
    user_id BIGINT NOT NULL COMMENT '购买用户ID',
    dataset_id BIGINT NOT NULL COMMENT '数据集ID',
    purchase_price DECIMAL(10,2) NOT NULL COMMENT '购买时的价格',
    transaction_hash VARCHAR(66) COMMENT '区块链交易哈希',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' COMMENT '购买状态',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_dataset (user_id, dataset_id),
    INDEX idx_user_id (user_id),
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_status (status),
    INDEX idx_purchased_at (purchased_at),
    INDEX idx_transaction_hash (transaction_hash)
) COMMENT='数据集购买记录表';
\`\`\`

## 3. 交易管理表

### transactions (交易记录表)
\`\`\`sql
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '交易记录唯一标识',
    transaction_id VARCHAR(100) NOT NULL UNIQUE COMMENT '业务交易ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    dataset_id BIGINT NOT NULL COMMENT '数据集ID',
    type ENUM('purchase', 'download') NOT NULL COMMENT '交易类型：购买/下载',
    amount DECIMAL(10,2) NOT NULL COMMENT '交易金额',
    platform_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT '平台手续费',
    transaction_hash VARCHAR(66) COMMENT '区块链交易哈希',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' COMMENT '交易状态',
    gas_used BIGINT COMMENT '消耗的Gas数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_transaction_hash (transaction_hash)
) COMMENT='交易记录表';
\`\`\`

## 4. 系统管理表

### system_config (系统配置表)
\`\`\`sql
CREATE TABLE system_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配置项唯一标识',
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键名',
    config_value TEXT NOT NULL COMMENT '配置值，JSON格式',
    description TEXT COMMENT '配置描述',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_config_key (config_key),
    INDEX idx_is_active (is_active)
) COMMENT='系统配置表';
\`\`\`

### announcements (公告表)
\`\`\`sql
CREATE TABLE announcements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '公告唯一标识',
    title VARCHAR(200) NOT NULL COMMENT '公告标题',
    content TEXT NOT NULL COMMENT '公告内容',
    type ENUM('info', 'warning', 'urgent') DEFAULT 'info' COMMENT '公告类型',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活显示',
    created_by BIGINT NOT NULL COMMENT '创建者用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_type (type),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) COMMENT='系统公告表';
\`\`\`

## 5. 内容安全表

### content_fingerprints (内容指纹表)
\`\`\`sql
CREATE TABLE content_fingerprints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '指纹记录唯一标识',
    fingerprint_id VARCHAR(64) NOT NULL UNIQUE COMMENT '指纹哈希ID',
    dataset_id BIGINT NOT NULL COMMENT '关联数据集ID',
    content_hash VARCHAR(64) NOT NULL COMMENT '内容哈希值',
    fingerprint_data TEXT NOT NULL COMMENT '指纹特征数据',
    submitted_by BIGINT NOT NULL COMMENT '提交者用户ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_fingerprint_id (fingerprint_id),
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_content_hash (content_hash),
    INDEX idx_is_active (is_active)
) COMMENT='内容指纹识别表';
\`\`\`

### piracy_reports (盗版举报表)
\`\`\`sql
CREATE TABLE piracy_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '举报记录唯一标识',
    original_dataset_id BIGINT NOT NULL COMMENT '原始数据集ID',
    suspicious_content_hash VARCHAR(64) NOT NULL COMMENT '可疑内容哈希',
    reported_by BIGINT NOT NULL COMMENT '举报者用户ID',
    evidence TEXT COMMENT '举报证据描述',
    status ENUM('pending', 'confirmed', 'dismissed') DEFAULT 'pending' COMMENT '处理状态',
    reviewed_by BIGINT NULL COMMENT '审核者用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '举报时间',
    reviewed_at TIMESTAMP NULL COMMENT '审核时间',
    FOREIGN KEY (original_dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_original_dataset_id (original_dataset_id),
    INDEX idx_reported_by (reported_by),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) COMMENT='盗版内容举报表';
\`\`\`

## 6. 用户行为表

### user_favorites (用户收藏表)
\`\`\`sql
CREATE TABLE user_favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '收藏记录唯一标识',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    dataset_id BIGINT NOT NULL COMMENT '数据集ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_dataset (user_id, dataset_id),
    INDEX idx_user_id (user_id),
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_created_at (created_at)
) COMMENT='用户收藏表';
\`\`\`

### dataset_reviews (数据集评价表)
\`\`\`sql
CREATE TABLE dataset_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评价记录唯一标识',
    user_id BIGINT NOT NULL COMMENT '评价用户ID',
    dataset_id BIGINT NOT NULL COMMENT '数据集ID',
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5) COMMENT '评分 1-5星',
    comment TEXT COMMENT '评价内容',
    is_anonymous BOOLEAN DEFAULT FALSE COMMENT '是否匿名评价',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_dataset (user_id, dataset_id),
    INDEX idx_user_id (user_id),
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
) COMMENT='数据集评价表';
\`\`\`

## 数据库初始化脚本

\`\`\`sql
-- 创建数据库
CREATE DATABASE ai_dataset_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE ai_dataset_platform;

-- 插入默认系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('platform_settings', '{"name":"AI数据集平台","description":"发现、购买和分享高质量的AI训练数据集","maintenanceMode":false,"registrationEnabled":true}', '平台基础设置'),
('fee_settings', '{"serviceFeeRate":2.5,"minDatasetPrice":0,"maxDatasetPrice":10000}', '费用设置'),
('file_settings', '{"maxFileSize":1073741824,"allowedFormats":["json","csv","jsonl","txt","parquet"]}', '文件上传设置');

-- 创建默认管理员用户
INSERT INTO users (username, email, password_hash, role, is_active, email_verified) VALUES
('admin', 'admin@platform.com', '$2b$12$hash_placeholder', 'admin', TRUE, TRUE);

