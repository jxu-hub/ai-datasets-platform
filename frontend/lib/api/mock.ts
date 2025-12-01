import type { User, Dataset, PlatformStats, ApiResponse, PaginatedResponse } from "@/types"

// MOCK: 临时Mock数据，需替换为真实API

/**
 * Mock用户数据
 */
export const mockUsers: User[] = [
  {
    id: 1,
    username: "regular_user", // Changed from buyer_user to regular_user
    email: "buyer@example.com",
    role: "buyer",
    avatar_url: "/diverse-user-avatars.png",
    reputation_score: 85,
    total_uploads: 0,
    total_downloads: 15,
    wallet: null,
    walletAddress: null, // Added walletAddress field
    is_active: true,
    created_at: "2024-01-15T08:00:00Z",
    total_spent: 1234.56, // mock消费金额
  },
  {
    id: 2,
    username: "seller_user",
    email: "seller@example.com",
    role: "seller",
    avatar_url: "/seller-avatar.png",
    reputation_score: 92,
    total_uploads: 8,
    total_downloads: 25,
    wallet: {
      id: 1,
      address: "0x1234567890123456789012345678901234567890",
      wallet_type: "MetaMask",
      bound_at: "2024-01-20T10:30:00Z",
    },
    walletAddress: "0x1234567890123456789012345678901234567890", // Added walletAddress field
    is_active: true,
    created_at: "2024-01-10T09:15:00Z",
    total_spent: 5678.9, // mock消费金额
  },
  {
    id: 3,
    username: "admin_user",
    email: "admin@example.com",
    role: "admin",
    avatar_url: "/admin-avatar.png",
    reputation_score: 100,
    total_uploads: 0,
    total_downloads: 0,
    wallet: null,
    walletAddress: null, // Added walletAddress field
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    total_spent: 0, // mock消费金额
  },
]

/**
 * Mock数据集数据
 */
export const mockDatasets: Dataset[] = [
  {
    id: 1,
    title: "中文新闻文本分类数据集",
    description:
      "包含50万条中文新闻文本数据，涵盖政治、经济、体育、娱乐、科技等15个分类，每条数据包含标题、正文、分类标签和发布时间，适用于文本分类、情感分析和自然语言处理研究。",
    category: "自然语言处理",
    tags: ["文本分类", "中文NLP", "新闻数据", "情感分析"],
    price: 0,
    is_free: true,
    file_url: "/datasets/chinese_news_classification.jsonl",
    file_size: 2048576000, // 2GB
    file_format: "JSONL",
    preview_data: [
      {
        id: "news_001",
        title: "人工智能技术在医疗领域的最新突破",
        content:
          "近日，清华大学计算机科学与技术系的研究团队发布了一项关于人工智能在医疗诊断领域的重大突破。该团队开发的深度学习模型能够通过分析医学影像数据，准确识别早期癌症病变，准确率达到95%以上。这项技术的应用将大大提高医疗诊断的效率和准确性，为患者提供更好的治疗方案。研究团队表示，该技术已经在多家三甲医院进行临床试验，效果显著。",
        category: "科技",
        publish_time: "2024-03-15T09:30:00Z",
        source: "科技日报",
        keywords: ["人工智能", "医疗", "深度学习", "癌症诊断"],
      },
      {
        id: "news_002",
        title: "全球经济复苏态势良好，中国贡献突出",
        content:
          "国际货币基金组织（IMF）最新发布的《世界经济展望报告》显示，全球经济正在稳步复苏，预计今年全球GDP增长率将达到3.2%。报告特别指出，中国经济的强劲表现为全球经济复苏提供了重要支撑。中国在制造业、服务业和消费领域的持续增长，不仅推动了国内经济发展，也为世界经济注入了活力。专家认为，中国的经济政策和改革措施为其他国家提供了宝贵经验。",
        category: "经济",
        publish_time: "2024-03-14T14:20:00Z",
        source: "经济参考报",
        keywords: ["全球经济", "GDP增长", "中国经济", "IMF报告"],
      },
      {
        id: "news_003",
        title: "春季养生指南：如何科学调理身体",
        content:
          "春季是万物复苏的季节，也是人体新陈代谢最活跃的时期。中医专家建议，春季养生应该遵循'春生夏长'的自然规律，注重调理肝脏功能，保持心情舒畅。在饮食方面，应该多食用新鲜蔬菜和水果，如菠菜、韭菜、草莓等，这些食物富含维生素和矿物质，有助于增强免疫力。同时，要适当进行户外运动，如散步、慢跑、太极拳等，促进血液循环，提高身体素质。",
        category: "健康",
        publish_time: "2024-03-13T08:45:00Z",
        source: "健康时报",
        keywords: ["春季养生", "中医调理", "饮食健康", "户外运动"],
      },
      {
        id: "news_004",
        title: "新能源汽车市场持续火热，销量创历史新高",
        content:
          "据中国汽车工业协会最新统计数据显示，今年前两个月新能源汽车销量达到93.3万辆，同比增长32.7%，创历史同期新高。其中，纯电动汽车销量为71.8万辆，插电式混合动力汽车销量为21.5万辆。业内专家分析认为，新能源汽车市场的快速发展得益于技术不断进步、充电基础设施日益完善以及消费者环保意识的提升。预计今年全年新能源汽车销量将突破800万辆，市场渗透率有望达到35%以上。",
        category: "汽车",
        publish_time: "2024-03-12T16:10:00Z",
        source: "汽车之家",
        keywords: ["新能源汽车", "销量增长", "电动汽车", "市场渗透率"],
      },
      {
        id: "news_005",
        title: "教育部发布新政策，推进高等教育数字化转型",
        content:
          "教育部近日发布《关于推进高等教育数字化转型的指导意见》，提出到2025年，基本建成高质量高等教育数字化体系。该政策要求各高校加快数字化教学资源建设，推广在线教育和混合式教学模式，提升教师数字化教学能力。同时，要建立健全数字化教学质量保障体系，确保教学效果。专家表示，这一政策将推动高等教育向更加开放、灵活、个性化的方向发展，为培养适应数字时代的高素质人才奠定基础。",
        category: "教育",
        publish_time: "2024-03-11T11:25:00Z",
        source: "中国教育报",
        keywords: ["高等教育", "数字化转型", "在线教育", "教学改革"],
      },
      {
        id: "news_006",
        title: "文化旅游融合发展，助力乡村振兴",
        content:
          "随着文化旅游产业的快速发展，越来越多的乡村地区通过挖掘本地文化资源，发展特色旅游项目，实现了经济发展和文化传承的双赢。江西省婺源县通过保护古村落、发展民宿经济，年接待游客超过2000万人次，旅游收入达到180亿元。当地村民不仅增加了收入，还成为了文化传承的主体。文化和旅游部表示，将继续支持乡村文化旅游发展，推出更多扶持政策，助力乡村振兴战略实施。",
        category: "旅游",
        publish_time: "2024-03-10T13:40:00Z",
        source: "中国旅游报",
        keywords: ["文化旅游", "乡村振兴", "古村落保护", "民宿经济"],
      },
      {
        id: "news_007",
        title: "体育产业蓬勃发展，全民健身热潮持续升温",
        content:
          "国家体育总局发布的最新数据显示，我国体育产业总规模已超过3万亿元，从业人员达到440万人。全民健身参与率不断提高，经常参加体育锻炼的人数比例达到37.2%。马拉松、健身房、户外运动等项目受到广泛欢迎，体育消费市场活力十足。专家认为，随着人们健康意识的增强和生活水平的提高，体育产业将迎来更大发展机遇。政府也将继续加大对体育基础设施建设的投入，为全民健身提供更好的条件。",
        category: "体育",
        publish_time: "2024-03-09T15:55:00Z",
        source: "体坛周报",
        keywords: ["体育产业", "全民健身", "马拉松", "健康生活"],
      },
      {
        id: "news_008",
        title: "环保科技创新成果显著，绿色发展理念深入人心",
        content:
          "近年来，我国在环保科技领域取得了一系列重要突破。新型污水处理技术、大气污染防治设备、固废资源化利用技术等创新成果不断涌现，为生态环境保护提供了有力支撑。同时，绿色发展理念在全社会得到广泛认同，企业积极履行环保责任，公众环保意识显著提升。生态环境部数据显示，全国空气质量持续改善，地表水环境质量稳中向好，土壤环境风险得到有效管控。这些成就为建设美丽中国奠定了坚实基础。",
        category: "环保",
        publish_time: "2024-03-08T10:15:00Z",
        source: "环境保护",
        keywords: ["环保科技", "绿色发展", "污染防治", "生态环境"],
      },
      {
        id: "news_009",
        title: "数字经济快速发展，成为经济增长新引擎",
        content:
          "中国信息通信研究院发布的《中国数字经济发展报告》显示，我国数字经济规模已达到45.5万亿元，占GDP比重达到39.8%。数字产业化和产业数字化协同推进，5G、人工智能、大数据、云计算等新技术广泛应用，催生了大量新业态新模式。电子商务、在线教育、远程医疗、数字金融等领域蓬勃发展，为经济社会发展注入了强劲动力。专家预测，未来几年数字经济仍将保持快速增长态势，成为推动高质量发展的重要力量。",
        category: "科技",
        publish_time: "2024-03-07T12:30:00Z",
        source: "人民邮电报",
        keywords: ["数字经济", "5G技术", "人工智能", "产业数字化"],
      },
      {
        id: "news_010",
        title: "食品安全监管持续加强，保障人民群众舌尖上的安全",
        content:
          "国家市场监督管理总局近日发布2023年食品安全监督抽检情况通报，全国食品安全总体状况持续稳定向好，抽检合格率达到97.8%。监管部门加大对食品生产经营企业的监督检查力度，严厉打击食品安全违法行为，建立健全食品安全追溯体系。同时，积极推进食品安全社会共治，引导消费者理性消费，提高食品安全意识。专家表示，食品安全是民生大事，需要政府、企业、社会各方共同努力，构建从农田到餐桌的全链条食品安全保障体系。",
        category: "民生",
        publish_time: "2024-03-06T14:45:00Z",
        source: "中国食品报",
        keywords: ["食品安全", "监督抽检", "安全监管", "社会共治"],
      },
    ],
    author: {
      id: 2,
      username: "nlp_researcher",
      avatar_url: "/seller-avatar.png",
      reputation_score: 92,
    },
    download_count: 1250,
    rating: 4.8,
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-15T14:30:00Z",
  },
  {
    id: 2,
    title: "电商用户评论情感分析数据集",
    description:
      "收集自主流电商平台的100万条真实用户评论数据，包含商品评价、情感标签、用户信息等字段。数据经过脱敏处理，涵盖电子产品、服装、食品、家居等多个品类，适用于情感分析、推荐系统和用户行为研究。",
    category: "自然语言处理",
    tags: ["情感分析", "用户评论", "电商数据", "推荐系统"],
    price: 199.99,
    is_free: false,
    file_url: "/datasets/ecommerce_sentiment.jsonl",
    file_size: 1524288000, // 1.5GB
    file_format: "JSONL",
    preview_data: [
      {
        review_id: "rv_001",
        product_id: "prod_12345",
        user_id: "user_anonymous_001",
        rating: 5,
        review_text:
          "这款手机真的太棒了！屏幕显示效果非常清晰，色彩饱和度很高，看视频和玩游戏的体验都很好。拍照功能也很强大，夜景模式下拍出来的照片比我之前用的手机清楚很多。电池续航能力也不错，正常使用一天完全没问题。快递很快，包装也很仔细，没有任何损坏。客服态度也很好，有问题都能及时回复。总的来说，这次购物体验非常满意，强烈推荐给大家！",
        sentiment: "positive",
        category: "电子产品",
        helpful_count: 23,
        timestamp: "2024-03-15T10:30:00Z",
      },
      {
        review_id: "rv_002",
        product_id: "prod_67890",
        user_id: "user_anonymous_002",
        rating: 2,
        review_text:
          "说实话，这件衣服的质量真的让我很失望。网上的图片看起来很好看，但是收到实物后发现颜色差别很大，而且面料摸起来很粗糙，完全不像描述中说的那么柔软舒适。尺码也不太准，我按照尺码表选的L码，结果穿起来偏小。洗了一次之后还出现了轻微的掉色现象。虽然价格不贵，但是这个质量确实配不上这个价位。客服的态度倒是还可以，但是退换货比较麻烦。下次购买服装还是要更加谨慎一些。",
        sentiment: "negative",
        category: "服装",
        helpful_count: 15,
        timestamp: "2024-03-14T16:45:00Z",
      },
      {
        review_id: "rv_003",
        product_id: "prod_11111",
        user_id: "user_anonymous_003",
        rating: 4,
        review_text:
          "这个咖啡机整体来说还是不错的，操作比较简单，按键设计很人性化，老人也能轻松使用。咖啡的味道还可以，虽然比不上专业咖啡店的水准，但是在家用机器中算是不错的了。清洁也比较方便，可拆卸的部件都能放进洗碗机。不过有几个小问题：首先是噪音稍微有点大，早上使用可能会影响家人休息；其次是水箱容量偏小，需要经常加水；最后是价格稍微有点贵，性价比一般。总的来说，如果预算充足的话还是值得购买的。",
        sentiment: "neutral",
        category: "家电",
        helpful_count: 31,
        timestamp: "2024-03-13T09:20:00Z",
      },
      {
        review_id: "rv_004",
        product_id: "prod_22222",
        user_id: "user_anonymous_004",
        rating: 5,
        review_text:
          "非常满意的一次购物！这套护肤品用了两周，效果真的很明显。皮肤变得更加光滑细腻，毛孔也缩小了不少，最重要的是没有出现任何过敏反应。质地很温和，敏感肌也能放心使用。包装很精美，送人也很有面子。价格虽然不便宜，但是考虑到效果和品质，还是很值得的。客服很专业，购买前咨询了很多问题都得到了详细的解答。物流也很快，第二天就收到了。会继续回购，也推荐给朋友们。",
        sentiment: "positive",
        category: "美妆",
        helpful_count: 42,
        timestamp: "2024-03-12T14:15:00Z",
      },
      {
        review_id: "rv_005",
        product_id: "prod_33333",
        user_id: "user_anonymous_005",
        rating: 1,
        review_text:
          "这是我买过最差的一次网购体验。首先，商品描述完全不符合实际，说是实木家具，结果收到的是密度板贴皮的。其次，包装极其简陋，到货时已经有多处磕碰和划痕。安装说明书也很不清楚，图示不够详细，安装过程很困难。最让人气愤的是，使用不到一个月就出现了质量问题，抽屉滑轨坏了，柜门也关不严。联系客服要求退货，但是被告知已经超过了退货期限，只能维修。维修师傅来了好几次都没有彻底解决问题。真的很后悔这次购买，大家千万不要买这个品牌的家具。",
        sentiment: "negative",
        category: "家具",
        helpful_count: 67,
        timestamp: "2024-03-11T11:50:00Z",
      },
    ],
    author: {
      id: 2,
      username: "data_scientist",
      avatar_url: "/seller-avatar.png",
      reputation_score: 92,
    },
    download_count: 89,
    rating: 4.6,
    created_at: "2024-01-20T15:45:00Z",
    updated_at: "2024-02-10T09:20:00Z",
  },
  {
    id: 3,
    title: "中文问答对话数据集",
    description:
      "包含200万条高质量中文问答对话数据，涵盖日常生活、学习工作、科技知识、历史文化等多个领域。每条数据包含问题、答案、对话上下文和质量评分，适用于对话系统、智能客服和问答机器人的训练。",
    category: "自然语言处理",
    tags: ["问答系统", "对话数据", "中文语料", "智能客服"],
    price: 0,
    is_free: true,
    file_url: "/datasets/chinese_qa_dialogue.jsonl",
    file_size: 3073741824, // 3GB
    file_format: "JSONL",
    preview_data: [
      {
        dialogue_id: "qa_001",
        question: "如何制作一杯好喝的咖啡？",
        answer:
          "制作一杯好喝的咖啡需要注意以下几个要点：1. 选择新鲜烘焙的咖啡豆，最好在烘焙后2-4周内使用；2. 根据冲泡方法选择合适的研磨粗细，手冲咖啡建议中细研磨；3. 控制水温在90-96摄氏度之间；4. 掌握好咖啡粉与水的比例，一般为1:15到1:17；5. 冲泡时间要适中，手冲咖啡建议2-4分钟；6. 使用优质的过滤纸和干净的器具。另外，个人口味偏好也很重要，可以根据自己的喜好调整浓度和口感。",
        context: "用户询问咖啡制作方法",
        quality_score: 4.8,
        domain: "生活技能",
        timestamp: "2024-03-15T08:30:00Z",
      },
      {
        dialogue_id: "qa_002",
        question: "Python中如何处理异常？",
        answer:
          "Python中处理异常主要使用try-except语句块。基本语法如下：\n\ntry:\n    # 可能出现异常的代码\n    result = 10 / 0\nexcept ZeroDivisionError:\n    # 处理特定异常\n    print('除数不能为零')\nexcept Exception as e:\n    # 处理其他异常\n    print(f'发生异常：{e}')\nelse:\n    # 没有异常时执行\n    print('执行成功')\nfinally:\n    # 无论是否有异常都会执行\n    print('清理工作')\n\n还可以使用raise语句主动抛出异常，以及自定义异常类。异常处理是Python编程中的重要概念，能够让程序更加健壮。",
        context: "编程学习讨论",
        quality_score: 4.9,
        domain: "编程技术",
        timestamp: "2024-03-14T14:20:00Z",
      },
      {
        dialogue_id: "qa_003",
        question: "中国古代四大发明是什么？它们对世界有什么影响？",
        answer:
          "中国古代四大发明是指纸、指南针、火药和印刷术。这些发明对世界文明发展产生了深远影响：\n\n1. 纸：东汉蔡伦改进造纸术，使纸张成为主要书写材料，促进了文化传播和教育普及。\n\n2. 指南针：最初用于风水，后来应用于航海，为地理大发现和海上贸易提供了重要工具。\n\n3. 火药：最初用于炼丹，后来发展为军事武器，改变了战争形态，也推动了采矿等民用领域的发展。\n\n4. 印刷术：北宋毕昇发明活字印刷，大大提高了书籍生产效率，推动了知识传播和文艺复兴。\n\n这些发明通过丝绸之路等途径传播到世界各地，对人类文明进步做出了巨大贡献。",
        context: "历史文化知识问答",
        quality_score: 4.7,
        domain: "历史文化",
        timestamp: "2024-03-13T16:45:00Z",
      },
      {
        dialogue_id: "qa_004",
        question: "如何保持身体健康？",
        answer:
          "保持身体健康需要从多个方面入手：\n\n1. 合理饮食：保持营养均衡，多吃蔬菜水果，少吃油腻和高糖食物，控制食量，定时进餐。\n\n2. 规律运动：每周至少进行150分钟中等强度运动，如快走、游泳、骑车等，还要加强力量训练。\n\n3. 充足睡眠：成年人每天需要7-9小时优质睡眠，保持规律的作息时间。\n\n4. 心理健康：学会管理压力，保持积极心态，培养兴趣爱好，维持良好的人际关系。\n\n5. 定期体检：及早发现和预防疾病，按时接种疫苗。\n\n6. 戒烟限酒：吸烟和过量饮酒都会严重损害健康。\n\n7. 保持良好卫生习惯：勤洗手，注意个人清洁。\n\n健康是一个综合概念，需要长期坚持才能看到效果。",
        context: "健康生活咨询",
        quality_score: 4.6,
        domain: "健康医疗",
        timestamp: "2024-03-12T10:15:00Z",
      },
      {
        dialogue_id: "qa_005",
        question: "什么是人工智能？它有哪些应用领域？",
        answer:
          "人工智能（Artificial Intelligence，AI）是指让机器模拟人类智能行为的技术。它包括机器学习、深度学习、自然语言处理、计算机视觉等多个分支。\n\n主要应用领域包括：\n\n1. 医疗健康：疾病诊断、药物研发、手术机器人、健康监测等。\n\n2. 交通运输：自动驾驶汽车、智能交通管理、路径优化等。\n\n3. 金融服务：风险评估、算法交易、反欺诈、智能投顾等。\n\n4. 教育培训：个性化学习、智能辅导、自动评分等。\n\n5. 娱乐媒体：推荐系统、内容生成、游戏AI、虚拟现实等。\n\n6. 制造业：质量检测、预测维护、智能制造、机器人等。\n\n7. 客户服务：智能客服、语音助手、聊天机器人等。\n\nAI技术正在快速发展，未来将在更多领域发挥重要作用。",
        context: "科技知识普及",
        quality_score: 4.8,
        domain: "科技知识",
        timestamp: "2024-03-11T13:30:00Z",
      },
    ],
    author: {
      id: 2,
      username: "ai_researcher",
      avatar_url: "/seller-avatar.png",
      reputation_score: 92,
    },
    download_count: 2100,
    rating: 4.9,
    created_at: "2024-01-15T12:00:00Z",
    updated_at: "2024-02-05T16:15:00Z",
  },
  // Additional free datasets
  {
    id: 4,
    title: "医学影像诊断数据集",
    description:
      "包含10万张医学影像数据，涵盖X光、CT、MRI等多种影像类型，每张图像都有专业医生标注的诊断结果，适用于医学影像AI诊断模型训练。",
    category: "计算机视觉",
    tags: ["医学影像", "诊断", "深度学习", "医疗AI"],
    price: 0,
    is_free: true,
    file_url: "/datasets/medical_imaging.zip",
    file_size: 5368709120, // 5GB
    file_format: "ZIP",
    preview_data: [],
    author: {
      id: 3,
      username: "medical_ai",
      avatar_url: "/diverse-user-avatars.png",
      reputation_score: 88,
    },
    download_count: 856,
    rating: 4.7,
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-02-20T11:30:00Z",
  },
  {
    id: 5,
    title: "股票价格预测时间序列数据",
    description:
      "收集了A股市场3000多只股票近10年的日线数据，包含开盘价、收盘价、最高价、最低价、成交量等信息，适用于量化交易和金融预测模型。",
    category: "金融数据",
    tags: ["股票数据", "时间序列", "量化交易", "金融预测"],
    price: 0,
    is_free: true,
    file_url: "/datasets/stock_prediction.csv",
    file_size: 1073741824, // 1GB
    file_format: "CSV",
    preview_data: [],
    author: {
      id: 4,
      username: "quant_trader",
      avatar_url: "/diverse-user-avatars.png",
      reputation_score: 91,
    },
    download_count: 1420,
    rating: 4.5,
    created_at: "2024-01-05T14:20:00Z",
    updated_at: "2024-02-18T16:45:00Z",
  },
  {
    id: 6,
    title: "中文语音识别数据集",
    description:
      "包含1000小时的中文语音数据，涵盖不同方言、年龄、性别的说话人，每段音频都有对应的文本标注，适用于语音识别和语音合成模型训练。",
    category: "音频处理",
    tags: ["语音识别", "中文语音", "ASR", "语音合成"],
    price: 0,
    is_free: true,
    file_url: "/datasets/chinese_speech.tar.gz",
    file_size: 8589934592, // 8GB
    file_format: "TAR.GZ",
    preview_data: [],
    author: {
      id: 5,
      username: "speech_lab",
      avatar_url: "/diverse-user-avatars.png",
      reputation_score: 94,
    },
    download_count: 678,
    rating: 4.8,
    created_at: "2024-01-08T10:15:00Z",
    updated_at: "2024-02-22T09:30:00Z",
  },
  {
    id: 7,
    title: "电商商品推荐数据集",
    description:
      "来自大型电商平台的用户行为数据，包含用户浏览、购买、评价等行为记录，以及商品信息和用户画像，适用于推荐系统算法研究。",
    category: "推荐系统",
    tags: ["推荐算法", "用户行为", "协同过滤", "电商数据"],
    price: 0,
    is_free: true,
    file_url: "/datasets/ecommerce_recommendation.jsonl",
    file_size: 2147483648, // 2GB
    file_format: "JSONL",
    preview_data: [],
    author: {
      id: 6,
      username: "rec_systems",
      avatar_url: "/diverse-user-avatars.png",
      reputation_score: 87,
    },
    download_count: 1156,
    rating: 4.6,
    created_at: "2024-01-12T13:40:00Z",
    updated_at: "2024-02-25T15:20:00Z",
  },
  {
    id: 8,
    title: "交通流量预测数据集",
    description:
      "收集了北京、上海、深圳等一线城市的交通流量数据，包含道路车流量、速度、密度等信息，适用于智能交通系统和城市规划研究。",
    category: "时间序列",
    tags: ["交通预测", "城市数据", "时间序列", "智能交通"],
    price: 0,
    is_free: true,
    file_url: "/datasets/traffic_flow.csv",
    file_size: 1610612736, // 1.5GB
    file_format: "CSV",
    preview_data: [],
    author: {
      id: 7,
      username: "traffic_ai",
      avatar_url: "/diverse-user-avatars.png",
      reputation_score: 89,
    },
    download_count: 934,
    rating: 4.4,
    created_at: "2024-01-18T11:25:00Z",
    updated_at: "2024-02-28T14:10:00Z",
  },
  {
    id: 9,
    title: "农作物病虫害识别数据集",
    description:
      "包含20万张农作物叶片图像，涵盖水稻、小麦、玉米等主要作物的常见病虫害，每张图像都有专业农学家标注，适用于农业AI应用开发。",
    category: "计算机视觉",
    tags: ["农业AI", "病虫害识别", "图像分类", "智慧农业"],
    price: 0,
    is_free: true,
    file_url: "/datasets/crop_disease.zip",
    file_size: 4294967296, // 4GB
    file_format: "ZIP",
    preview_data: [],
    author: {
      id: 8,
      username: "agri_tech",
      avatar_url: "/diverse-user-avatars.png",
      reputation_score: 86,
    },
    download_count: 567,
    rating: 4.7,
    created_at: "2024-01-22T08:50:00Z",
    updated_at: "2024-03-02T10:35:00Z",
  },
  {
    id: 10,
    title: "中文古诗词生成数据集",
    description:
      "收集了唐诗宋词等经典古诗词作品10万首，包含诗词内容、作者、朝代、题材等信息，适用于古诗词生成和文学研究。",
    category: "自然语言处理",
    tags: ["古诗词", "文本生成", "中文文学", "创作AI"],
    price: 0,
    is_free: true,
    file_url: "/datasets/chinese_poetry.jsonl",
    file_size: 536870912, // 512MB
    file_format: "JSONL",
    preview_data: [],
    author: {
      id: 9,
      username: "poetry_ai",
      avatar_url: "/diverse-user-avatars.png",
      reputation_score: 92,
    },
    download_count: 1789,
    rating: 4.9,
    created_at: "2024-01-25T16:30:00Z",
    updated_at: "2024-03-05T12:15:00Z",
  },
  {
    id: 11,
    title: "工业设备故障诊断数据集",
    description:
      "来自制造业的设备传感器数据，包含温度、压力、振动等多维度传感器读数，以及对应的设备状态标签，适用于预测性维护和故障诊断。",
    category: "时间序列",
    tags: ["故障诊断", "工业4.0", "预测维护", "传感器数据"],
    price: 0,
    is_free: true,
    file_url: "/datasets/industrial_fault.csv",
    file_size: 1879048192, // 1.75GB
    file_format: "CSV",
    preview_data: [],
    author: {
      id: 10,
      username: "industry_ai",
      avatar_url: "/diverse-user-avatars.png",
      reputation_score: 88,
    },
    download_count: 723,
    rating: 4.5,
    created_at: "2024-01-28T09:45:00Z",
    updated_at: "2024-03-08T11:20:00Z",
  },
  {
    id: 12,
    title: "多模态情感分析数据集",
    description:
      "包含文本、图像、音频三种模态的情感数据，每个样本都有对应的情感标签，适用于多模态机器学习和情感计算研究。",
    category: "其他",
    tags: ["多模态", "情感分析", "机器学习", "情感计算"],
    price: 0,
    is_free: true,
    file_url: "/datasets/multimodal_emotion.tar.gz",
    file_size: 6442450944, // 6GB
    file_format: "TAR.GZ",
    preview_data: [],
    author: {
      id: 11,
      username: "emotion_lab",
      avatar_url: "/diverse-user-avatars.png",
      reputation_score: 90,
    },
    download_count: 445,
    rating: 4.6,
    created_at: "2024-02-01T14:10:00Z",
    updated_at: "2024-03-10T16:40:00Z",
  },
  // Paid datasets
  {
    id: 13,
    title: "高精度人脸识别数据集",
    description:
      "包含100万张高清人脸图像，涵盖不同年龄、性别、种族的人群，每张图像都有68个关键点标注和身份标签，适用于人脸识别和人脸分析系统开发。",
    category: "计算机视觉",
    tags: ["人脸识别", "生物识别", "关键点检测", "身份验证"],
    price: 299.99,
    is_free: false,
    file_url: "/datasets/face_recognition_premium.zip",
    file_size: 10737418240, // 10GB
    file_format: "ZIP",
    preview_data: [],
    author: {
      id: 12,
      username: "vision_pro",
      avatar_url: "/seller-avatar.png",
      reputation_score: 95,
    },
    download_count: 234,
    rating: 4.8,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-02-20T14:15:00Z",
  },
  {
    id: 14,
    title: "金融风控建模数据集",
    description:
      "来自银行和金融机构的真实脱敏数据，包含用户征信、交易行为、风险标签等信息，适用于信贷风控、反欺诈等金融AI应用。",
    category: "金融数据",
    tags: ["风控建模", "信贷评估", "反欺诈", "金融科技"],
    price: 599.99,
    is_free: false,
    file_url: "/datasets/financial_risk.csv",
    file_size: 3221225472, // 3GB
    file_format: "CSV",
    preview_data: [],
    author: {
      id: 13,
      username: "fintech_data",
      avatar_url: "/seller-avatar.png",
      reputation_score: 93,
    },
    download_count: 156,
    rating: 4.7,
    created_at: "2024-01-20T11:45:00Z",
    updated_at: "2024-02-25T09:30:00Z",
  },
  {
    id: 15,
    title: "智能客服对话数据集",
    description:
      "收集自大型企业客服系统的真实对话数据，包含用户问题、客服回复、问题分类、满意度评分等，适用于智能客服机器人训练。",
    category: "自然语言处理",
    tags: ["智能客服", "对话系统", "问答匹配", "客户服务"],
    price: 399.99,
    is_free: false,
    file_url: "/datasets/customer_service.jsonl",
    file_size: 2684354560, // 2.5GB
    file_format: "JSONL",
    preview_data: [],
    author: {
      id: 14,
      username: "service_ai",
      avatar_url: "/seller-avatar.png",
      reputation_score: 91,
    },
    download_count: 187,
    rating: 4.6,
    created_at: "2024-01-25T13:20:00Z",
    updated_at: "2024-03-01T15:45:00Z",
  },
  {
    id: 16,
    title: "自动驾驶场景数据集",
    description:
      "包含城市道路、高速公路、停车场等多种驾驶场景的高清视频和激光雷达数据，每帧都有详细的目标检测和语义分割标注。",
    category: "计算机视觉",
    tags: ["自动驾驶", "目标检测", "语义分割", "激光雷达"],
    price: 899.99,
    is_free: false,
    file_url: "/datasets/autonomous_driving.tar.gz",
    file_size: 21474836480, // 20GB
    file_format: "TAR.GZ",
    preview_data: [],
    author: {
      id: 15,
      username: "auto_drive",
      avatar_url: "/seller-avatar.png",
      reputation_score: 96,
    },
    download_count: 89,
    rating: 4.9,
    created_at: "2024-01-30T08:15:00Z",
    updated_at: "2024-03-05T10:20:00Z",
  },
  {
    id: 17,
    title: "药物分子设计数据集",
    description: "包含100万个药物分子的化学结构、生物活性、毒性等信息，适用于药物发现、分子生成和化学信息学研究。",
    category: "医疗健康",
    tags: ["药物发现", "分子设计", "化学信息学", "生物活性"],
    price: 799.99,
    is_free: false,
    file_url: "/datasets/drug_discovery.sdf",
    file_size: 5368709120, // 5GB
    file_format: "SDF",
    preview_data: [],
    author: {
      id: 16,
      username: "pharma_ai",
      avatar_url: "/seller-avatar.png",
      reputation_score: 94,
    },
    download_count: 67,
    rating: 4.8,
    created_at: "2024-02-02T12:40:00Z",
    updated_at: "2024-03-08T14:25:00Z",
  },
  {
    id: 18,
    title: "高频交易策略数据集",
    description: "包含期货、外汇、股票等多个市场的高频tick数据，以及对应的交易策略标签，适用于量化交易和算法交易研究。",
    category: "金融数据",
    tags: ["高频交易", "算法交易", "tick数据", "量化策略"],
    price: 1299.99,
    is_free: false,
    file_url: "/datasets/hft_strategies.h5",
    file_size: 8589934592, // 8GB
    file_format: "HDF5",
    preview_data: [],
    author: {
      id: 17,
      username: "hft_quant",
      avatar_url: "/seller-avatar.png",
      reputation_score: 97,
    },
    download_count: 45,
    rating: 4.9,
    created_at: "2024-02-05T09:55:00Z",
    updated_at: "2024-03-10T11:30:00Z",
  },
  {
    id: 19,
    title: "工业质检图像数据集",
    description: "来自制造业生产线的产品质检图像，包含正常产品和各种缺陷产品的高清图像，每张图像都有精确的缺陷标注。",
    category: "计算机视觉",
    tags: ["质量检测", "缺陷检测", "工业视觉", "制造业"],
    price: 499.99,
    is_free: false,
    file_url: "/datasets/industrial_qc.zip",
    file_size: 7516192768, // 7GB
    file_format: "ZIP",
    preview_data: [],
    author: {
      id: 18,
      username: "qc_vision",
      avatar_url: "/seller-avatar.png",
      reputation_score: 89,
    },
    download_count: 123,
    rating: 4.5,
    created_at: "2024-02-08T14:30:00Z",
    updated_at: "2024-03-12T16:10:00Z",
  },
  {
    id: 20,
    title: "多语言机器翻译数据集",
    description:
      "包含中英日韩等10种语言的平行语料，总计500万句对，每个句对都经过人工校对，适用于神经机器翻译模型训练。",
    category: "自然语言处理",
    tags: ["机器翻译", "多语言", "平行语料", "神经翻译"],
    price: 699.99,
    is_free: false,
    file_url: "/datasets/multilingual_mt.jsonl",
    file_size: 4294967296, // 4GB
    file_format: "JSONL",
    preview_data: [],
    author: {
      id: 19,
      username: "translate_ai",
      avatar_url: "/seller-avatar.png",
      reputation_score: 92,
    },
    download_count: 98,
    rating: 4.7,
    created_at: "2024-02-10T10:20:00Z",
    updated_at: "2024-03-15T12:45:00Z",
  },
  {
    id: 21,
    title: "智能音箱语音交互数据集",
    description:
      "收集自智能音箱的真实用户语音交互数据，包含语音指令、设备响应、用户意图等信息，适用于语音助手和智能家居系统开发。",
    category: "音频处理",
    tags: ["语音交互", "智能音箱", "意图识别", "智能家居"],
    price: 449.99,
    is_free: false,
    file_url: "/datasets/smart_speaker.tar.gz",
    file_size: 6442450944, // 6GB
    file_format: "TAR.GZ",
    preview_data: [],
    author: {
      id: 20,
      username: "voice_tech",
      avatar_url: "/seller-avatar.png",
      reputation_score: 88,
    },
    download_count: 134,
    rating: 4.4,
    created_at: "2024-02-12T15:10:00Z",
    updated_at: "2024-03-18T09:25:00Z",
  },
  {
    id: 22,
    title: "电商个性化推荐数据集",
    description:
      "来自头部电商平台的用户行为和商品数据，包含用户画像、商品特征、交互历史等，适用于个性化推荐算法研究和商业应用。",
    category: "推荐系统",
    tags: ["个性化推荐", "用户画像", "商品推荐", "电商算法"],
    price: 549.99,
    is_free: false,
    file_url: "/datasets/personalized_rec.jsonl",
    file_size: 3758096384, // 3.5GB
    file_format: "JSONL",
    preview_data: [],
    author: {
      id: 21,
      username: "ecom_rec",
      avatar_url: "/seller-avatar.png",
      reputation_score: 90,
    },
    download_count: 167,
    rating: 4.6,
    created_at: "2024-02-15T11:35:00Z",
    updated_at: "2024-03-20T13:50:00Z",
  },
  {
    id: 23,
    title: "城市空气质量预测数据集",
    description:
      "收集了全国300个城市5年来的空气质量数据，包含PM2.5、PM10、臭氧等指标，以及气象数据，适用于环境预测和城市规划。",
    category: "时间序列",
    tags: ["空气质量", "环境预测", "城市数据", "气象分析"],
    price: 349.99,
    is_free: false,
    file_url: "/datasets/air_quality.csv",
    file_size: 2147483648, // 2GB
    file_format: "CSV",
    preview_data: [],
    author: {
      id: 22,
      username: "env_data",
      avatar_url: "/seller-avatar.png",
      reputation_score: 87,
    },
    download_count: 201,
    rating: 4.3,
    created_at: "2024-02-18T08:45:00Z",
    updated_at: "2024-03-22T10:15:00Z",
  },
  {
    id: 24,
    title: "医疗问诊对话数据集",
    description:
      "包含医生与患者的真实问诊对话记录，涵盖内科、外科、儿科等多个科室，每个对话都有疾病诊断和治疗建议标注。",
    category: "医疗健康",
    tags: ["医疗问诊", "疾病诊断", "医疗对话", "临床数据"],
    price: 999.99,
    is_free: false,
    file_url: "/datasets/medical_consultation.jsonl",
    file_size: 1610612736, // 1.5GB
    file_format: "JSONL",
    preview_data: [],
    author: {
      id: 23,
      username: "med_dialogue",
      avatar_url: "/seller-avatar.png",
      reputation_score: 95,
    },
    download_count: 78,
    rating: 4.8,
    created_at: "2024-02-20T13:25:00Z",
    updated_at: "2024-03-25T15:40:00Z",
  },
]

/**
 * Mock平台统计数据
 */
export const mockPlatformStats: PlatformStats = {
  total_datasets: 1250,
  total_users: 8900,
  total_transactions: 15600,
  total_revenue: 125000.5,
}

/**
 * Mock API延迟函数
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Mock认证API
 */
export const mockAuthAPI = {
  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    await delay(1000)

    // Mock password validation - in production, use proper password hashing
    const validCredentials = [
      { email: "buyer@example.com", password: "buyer123", role: "buyer" },
      { email: "seller@example.com", password: "seller123", role: "seller" },
      { email: "admin@example.com", password: "admin123", role: "admin" },
    ]

    const validCredential = validCredentials.find(
      (cred) => cred.email === credentials.email && cred.password === credentials.password,
    )

    if (!validCredential) {
      return { success: false, error: "邮箱或密码错误" }
    }

    // Find user by email and verify role matches
    const user = mockUsers.find((u) => u.email === credentials.email && u.role === validCredential.role)
    if (!user) {
      return { success: false, error: "用户不存在或角色不匹配" }
    }

    // Mock JWT token
    const token = `mock_jwt_token_${user.id}_${Date.now()}`

    console.log("[v0] Login successful for user:", user.username, "with role:", user.role)

    return {
      success: true,
      data: { user, token },
      message: "登录成功",
    }
  },

  async register(userData: {
    username: string
    email: string
    password: string
    verification_code: string
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    await delay(1500)

    // 检查用户是否已存在
    const existingUser = mockUsers.find((u) => u.email === userData.email || u.username === userData.username)
    if (existingUser) {
      return { success: false, error: "用户已存在" }
    }

    // 创建新用户
    const newUser: User = {
      id: mockUsers.length + 1,
      username: userData.username,
      email: userData.email,
      role: "buyer", // 默认角色
      reputation_score: 0,
      total_uploads: 0,
      total_downloads: 0,
      wallet: null,
      walletAddress: null, // Added walletAddress field
      is_active: true,
      created_at: new Date().toISOString(),
    }

    mockUsers.push(newUser)
    const token = `mock_jwt_token_${newUser.id}_${Date.now()}`

    return {
      success: true,
      data: { user: newUser, token },
      message: "注册成功",
    }
  },

  async sendVerificationCode(email: string): Promise<ApiResponse> {
    await delay(500)
    return {
      success: true,
      message: "验证码已发送到您的邮箱",
    }
  },

  async upgradeToSeller(userId: number): Promise<ApiResponse<{ user: User }>> {
    await delay(1000)

    const user = mockUsers.find((u) => u.id === userId)
    if (!user) {
      return { success: false, error: "用户不存在" }
    }

    if (user.role !== "buyer") {
      return { success: false, error: "只有普通用户可以升级为商家" }
    }

    const currentWallet = user.wallet
    const currentWalletAddress = user.walletAddress

    user.role = "seller"

    // Keep wallet information intact after upgrade
    if (currentWallet) {
      user.wallet = currentWallet
    }
    if (currentWalletAddress) {
      user.walletAddress = currentWalletAddress
    }

    return {
      success: true,
      data: { user },
      message: "升级成功，请重新登录以获得完整权限",
    }
  },
}

const mockPurchases: { userId: number; datasetId: number; purchasedAt: string }[] = []

/**
 * Mock数据集API
 */
export const mockDatasetAPI = {
  async getDatasets(params: {
    page?: number
    limit?: number
    category?: string
    is_free?: boolean
    search?: string
    fileSizeRange?: string // Added file size range parameter
  }): Promise<ApiResponse<PaginatedResponse<Dataset>>> {
    await delay(800)

    let filteredDatasets = [...mockDatasets]

    // 筛选条件
    if (params.is_free !== undefined) {
      filteredDatasets = filteredDatasets.filter((d) => d.is_free === params.is_free)
    }

    if (params.category) {
      filteredDatasets = filteredDatasets.filter((d) => d.category === params.category)
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredDatasets = filteredDatasets.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description.toLowerCase().includes(searchLower) ||
          d.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      )
    }

    if (params.fileSizeRange && params.fileSizeRange !== "all") {
      const [minStr, maxStr] = params.fileSizeRange.split("-")
      const minGB = Number.parseFloat(minStr.replace("GB", ""))
      const maxGB = Number.parseFloat(maxStr.replace("GB", ""))

      filteredDatasets = filteredDatasets.filter((d) => {
        const sizeGB = d.file_size / (1024 * 1024 * 1024) // Convert bytes to GB
        return sizeGB >= minGB && sizeGB <= maxGB
      })
    }

    // 分页
    const page = params.page || 1
    const limit = params.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedDatasets = filteredDatasets.slice(startIndex, endIndex)

    return {
      success: true,
      data: {
        items: paginatedDatasets,
        total: filteredDatasets.length,
        page,
        limit,
        totalPages: Math.ceil(filteredDatasets.length / limit),
      },
    }
  },

  async getDatasetById(id: number): Promise<ApiResponse<Dataset>> {
    await delay(500)

    const dataset = mockDatasets.find((d) => d.id === id)
    if (!dataset) {
      return { success: false, error: "数据集不存在" }
    }

    return {
      success: true,
      data: dataset,
    }
  },

  async purchaseDataset(userId: number, datasetId: number): Promise<ApiResponse<{ success: boolean }>> {
    await delay(1000)

    const user = mockUsers.find((u) => u.id === userId)
    const dataset = mockDatasets.find((d) => d.id === datasetId)

    if (!user) {
      return { success: false, error: "用户不存在" }
    }

    if (!dataset) {
      return { success: false, error: "数据集不存在" }
    }

    if (dataset.is_free) {
      return { success: false, error: "免费数据集无需购买" }
    }

    // Check if already purchased
    const existingPurchase = mockPurchases.find((p) => p.userId === userId && p.datasetId === datasetId)
    if (existingPurchase) {
      return { success: false, error: "您已经购买过此数据集" }
    }

    // Add purchase record
    mockPurchases.push({
      userId,
      datasetId,
      purchasedAt: new Date().toISOString(),
    })

    // Update dataset download count
    dataset.download_count += 1

    return {
      success: true,
      data: { success: true },
      message: "购买成功",
    }
  },

  async checkPurchaseStatus(userId: number, datasetId: number): Promise<ApiResponse<{ hasPurchased: boolean }>> {
    await delay(300)

    const hasPurchased = mockPurchases.some((p) => p.userId === userId && p.datasetId === datasetId)

    return {
      success: true,
      data: { hasPurchased },
    }
  },

  async getDatasetsByAuthor(authorId: number): Promise<ApiResponse<Dataset[]>> {
    await delay(500)

    const datasets = mockDatasets.filter((d) => d.author.id === authorId)

    return {
      success: true,
      data: datasets,
    }
  },
}

/**
 * Mock平台统计API
 */
export const mockStatsAPI = {
  async getPlatformStats(): Promise<ApiResponse<PlatformStats>> {
    await delay(300)

    return {
      success: true,
      data: mockPlatformStats,
    }
  },
}

/**
 * Mock管理员API
 */
export const mockAdminAPI = {
  // 获取管理员仪表板统计数据
  async getDashboardStats(): Promise<ApiResponse<any>> {
    await delay(800)

    const adminStats = {
      platformStats: {
        totalUsers: mockUsers.length,
        totalDatasets: mockDatasets.length,
        totalTransactions: mockPurchases.length,
        totalRevenue: mockDatasets.reduce((sum, d) => sum + (d.is_free ? 0 : d.price * d.download_count), 0),
        monthlyGrowth: {
          users: 12.5,
          datasets: 8.3,
          transactions: 15.7,
          revenue: 22.1,
        },
      },
      systemHealth: {
        status: "healthy" as const,
        uptime: 99.8,
        responseTime: 120,
        errorRate: 0.02,
        activeUsers: Math.floor(mockUsers.length * 0.15),
      },
      recentActivity: [
        {
          id: "1",
          type: "user_register",
          title: "新用户注册",
          description: "用户 ai_researcher 完成注册",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          severity: "info",
          user: "ai_researcher",
        },
        {
          id: "2",
          type: "dataset_upload",
          title: "数据集上传",
          description: "商家上传了新的金融数据集",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          severity: "info",
          user: "finance_seller",
        },
        {
          id: "3",
          type: "report",
          title: "内容举报",
          description: "数据集被举报包含敏感内容",
          timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
          severity: "warning",
          user: "concerned_user",
        },
      ],
      pendingTasks: [
        {
          id: "1",
          type: "dataset_review",
          title: "数据集审核",
          description: "3个数据集等待审核",
          priority: "high",
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          type: "fingerprint_detection",
          title: "指纹检测",
          description: "发现5个疑似盗版数据集",
          priority: "high",
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ],
    }

    return {
      success: true,
      data: adminStats,
    }
  },

  // 获取所有用户列表
  async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    role?: string
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    await delay(600)

    let filteredUsers = [...mockUsers]

    // 搜索过滤
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (u) => u.username.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower),
      )
    }

    // 角色过滤
    if (params.role) {
      filteredUsers = filteredUsers.filter((u) => u.role === params.role)
    }

    // 分页
    const page = params.page || 1
    const limit = params.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    return {
      success: true,
      data: {
        items: paginatedUsers,
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
      },
    }
  },

  // 获取用户详情
  async getUserDetail(userId: number): Promise<ApiResponse<User & { purchaseHistory: any[] }>> {
    await delay(400)

    const user = mockUsers.find((u) => u.id === userId)
    if (!user) {
      return { success: false, error: "用户不存在" }
    }

    // 获取用户购买历史
    const userPurchases = mockPurchases
      .filter((p) => p.userId === userId)
      .map((p) => {
        const dataset = mockDatasets.find((d) => d.id === p.datasetId)
        return {
          id: p.datasetId,
          title: dataset?.title || "未知数据集",
          price: dataset?.price || 0,
          purchasedAt: p.purchasedAt,
        }
      })

    return {
      success: true,
      data: {
        ...user,
        purchaseHistory: userPurchases,
      },
    }
  },

  // 获取所有数据集（管理员视图）
  async getAllDatasets(params: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }): Promise<ApiResponse<PaginatedResponse<Dataset>>> {
    await delay(700)

    let filteredDatasets = [...mockDatasets]

    // 搜索过滤
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredDatasets = filteredDatasets.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description.toLowerCase().includes(searchLower) ||
          d.author.username.toLowerCase().includes(searchLower),
      )
    }

    // 分类过滤
    if (params.category) {
      filteredDatasets = filteredDatasets.filter((d) => d.category === params.category)
    }

    // 分页
    const page = params.page || 1
    const limit = params.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedDatasets = filteredDatasets.slice(startIndex, endIndex)

    return {
      success: true,
      data: {
        items: paginatedDatasets,
        total: filteredDatasets.length,
        page,
        limit,
        totalPages: Math.ceil(filteredDatasets.length / limit),
      },
    }
  },

  // 删除数据集
  async deleteDataset(datasetId: number): Promise<ApiResponse<{ success: boolean }>> {
    await delay(500)

    const datasetIndex = mockDatasets.findIndex((d) => d.id === datasetId)
    if (datasetIndex === -1) {
      return { success: false, error: "数据集不存在" }
    }

    // 删除数据集
    mockDatasets.splice(datasetIndex, 1)

    // 删除相关购买记录
    const purchaseIndexes = mockPurchases
      .map((p, index) => (p.datasetId === datasetId ? index : -1))
      .filter((index) => index !== -1)
      .reverse()

    purchaseIndexes.forEach((index) => {
      mockPurchases.splice(index, 1)
    })

    return {
      success: true,
      data: { success: true },
      message: "数据集删除成功",
    }
  },

  // 指纹检测
  async detectFingerprint(file: File): Promise<ApiResponse<any>> {
    await delay(1000)
    let detectionResult
    if (file.name.includes("suspicious")) {
      // 有指纹，给出区块链地址
      detectionResult = {
        fileHash: `hash_${Date.now()}`,
        detectionId: `detect_${Date.now()}`,
        matches: [
          {
            fingerprint: `${Date.now()}`,
            address: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
          },
        ],
        analysisTime: "1.0s",
        fileSize: file.size,
        fileName: file.name,
      }
    } else if (file.name.includes("no_fingerprint")) {
      // 无指纹
      detectionResult = {
        fileHash: `hash_${Date.now()}`,
        detectionId: `detect_${Date.now()}`,
        matches: [],
        analysisTime: "0.8s",
        fileSize: file.size,
        fileName: file.name,
      }
    } else {
      // 默认无指纹
      detectionResult = {
        fileHash: `hash_${Date.now()}`,
        detectionId: `detect_${Date.now()}`,
        matches: [],
        analysisTime: "0.8s",
        fileSize: file.size,
        fileName: file.name,
      }
    }
    return {
      success: true,
      data: detectionResult,
      message: "指纹检测完成",
    }
  },

  // 获取指纹检测历史
  async getDetectionHistory(params: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    await delay(500)
    // 新mock历史数据
    const mockHistory = [
      {
        id: "detect_001",
        fileName: "suspicious_dataset.jsonl",
        detectionTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        matches: 1, // 有指纹
        status: "completed",
      },
      {
        id: "detect_002",
        fileName: "user_upload_data.jsonl",
        detectionTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        matches: 0, // 无指纹
        status: "completed",
      },
      {
        id: "detect_003",
        fileName: "nlp_dataset_copy.jsonl",
        detectionTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        matches: 1, // 有指纹
        status: "completed",
      },
    ]
    const page = params.page || 1
    const limit = params.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedHistory = mockHistory.slice(startIndex, endIndex)
    return {
      success: true,
      data: {
        items: paginatedHistory,
        total: mockHistory.length,
        page,
        limit,
        totalPages: Math.ceil(mockHistory.length / limit),
      },
    }
  },

  // 获取系统配置
  async getSystemConfig(): Promise<ApiResponse<any>> {
    await delay(500)

    // Get stored config from localStorage or use defaults
    const storedConfig = typeof window !== "undefined" ? localStorage.getItem("admin_system_config") : null
    const defaultConfig = {
      platform: {
        name: "AI数据集平台",
        description: "发现、购买和分享高质量的AI训练数据集，连接数据提供者与AI开发者，推动人工智能技术发展。",
        maintenanceMode: false,
        registrationEnabled: true,
      },
      fees: {
        serviceFeeRate: 2.5,
      },
      announcements: [
        {
          id: 1,
          title: "平台升级公告",
          content: "为了提供更好的服务体验，平台将于本周末进行系统升级，预计维护时间2小时。",
          type: "info" as const,
          enabled: true,
          createdAt: "2024-03-10T10:00:00Z",
        },
        {
          id: 3,
          title: "安全提醒",
          content: "请注意保护您的账户安全，不要向他人透露密码和钱包私钥信息。",
          type: "warning" as const,
          enabled: false,
          createdAt: "2024-03-05T09:15:00Z",
        },
      ],
      policies: {
        termsOfService:
          "欢迎使用AI数据集平台。通过访问和使用本平台，您同意遵守以下服务条款：\n\n1. 服务说明\n本平台为用户提供数据集交易服务，包括数据集上传、下载、购买等功能。\n\n2. 用户责任\n用户应确保上传的数据集合法合规，不侵犯他人知识产权。\n\n3. 平台权利\n平台有权对违规内容进行审核和处理。\n\n4. 免责声明\n平台不对数据集的准确性和完整性承担责任。\n\n5. 服务变更\n平台保留随时修改服务条款的权利。",
        privacyPolicy:
          "我们重视您的隐私保护。本隐私政策说明我们如何收集、使用和保护您的个人信息：\n\n1. 信息收集\n我们收集您主动提供的信息，如注册信息、上传的数据集等。\n\n2. 信息使用\n我们使用收集的信息来提供服务、改进用户体验。\n\n3. 信息保护\n我们采用行业标准的安全措施保护您的信息。\n\n4. 信息共享\n除法律要求外，我们不会向第三方分享您的个人信息。\n\n5. Cookie使用\n我们使用Cookie来改善网站功能和用户体验。",
        dataUsagePolicy:
          "数据使用政策规定了平台上数据集的使用规范：\n\n1. 合法使用\n用户应仅将数据集用于合法目的，不得用于违法活动。\n\n2. 版权保护\n尊重数据集创作者的版权，不得未经授权复制或分发。\n\n3. 商业使用\n商业使用数据集需要获得相应授权。\n\n4. 数据安全\n用户应妥善保管下载的数据集，防止泄露。\n\n5. 违规处理\n违反数据使用政策的用户将面临账户限制或封禁。",
      },
    }

    const systemConfig = storedConfig ? { ...defaultConfig, ...JSON.parse(storedConfig) } : defaultConfig

    return {
      success: true,
      data: systemConfig,
    }
  },

  // 更新系统配置
  async updateSystemConfig(section: string, data: any): Promise<ApiResponse<{ success: boolean }>> {
    await delay(800)

    console.log(`[v0] Updating system config section: ${section}`, data)

    try {
      if (typeof window !== "undefined") {
        // Get current stored config
        const storedConfig = localStorage.getItem("admin_system_config")
        const currentConfig = storedConfig ? JSON.parse(storedConfig) : {}

        // Update the specific section
        const updatedConfig = {
          ...currentConfig,
          [section]: data,
        }

        // Save back to localStorage
        localStorage.setItem("admin_system_config", JSON.stringify(updatedConfig))
      }

      return {
        success: true,
        data: { success: true },
        message: `${section}配置更新成功`,
      }
    } catch (error) {
      return {
        success: false,
        error: "配置保存失败",
      }
    }
  },

  // Get wallet change requests
  async getWalletChangeRequests(
    params: {
      page?: number
      limit?: number
      status?: string
    } = {},
  ): Promise<{ requests: any[] }> {
    await delay(600)

    // Get requests from localStorage
    const allRequests =
      typeof window !== "undefined" ? JSON.parse(localStorage.getItem("wallet_change_requests") || "[]") : []

    let filteredRequests = [...allRequests]

    // Status filter
    if (params.status && params.status !== "all") {
      filteredRequests = filteredRequests.filter((req: any) => req.status === params.status)
    }

    // Add user info to requests
    const requestsWithUserInfo = filteredRequests.map((req: any) => {
      const user = mockUsers.find((u) => u.id === req.userId)
      return {
        ...req,
        userName: user ? user.username : "Unknown User",
        userEmail: user ? user.email : "",
      }
    })

    return {
      requests: requestsWithUserInfo,
    }
  },

  // Approve/reject wallet change request
  async reviewWalletChangeRequest(
    requestId: string,
    action: "approve" | "reject",
    adminId: number,
  ): Promise<ApiResponse<{ success: boolean }>> {
    await delay(800)

    if (typeof window !== "undefined") {
      const allRequests = JSON.parse(localStorage.getItem("wallet_change_requests") || "[]")
      const requestIndex = allRequests.findIndex((req: any) => req.id === requestId)

      if (requestIndex === -1) {
        return { success: false, error: "申请不存在" }
      }

      const request = allRequests[requestIndex]
      request.status = action === "approve" ? "approved" : "rejected"
      request.reviewedAt = new Date().toISOString()
      request.reviewedBy = adminId

      // If approved, update user's wallet address
      if (action === "approve") {
        const user = mockUsers.find((u) => u.id === request.userId)
        if (user) {
          user.walletAddress = request.newWalletAddress
        }
      }

      localStorage.setItem("wallet_change_requests", JSON.stringify(allRequests))
    }

    return {
      success: true,
      data: { success: true },
      message: action === "approve" ? "申请已批准" : "申请已拒绝",
    }
  },

  async approveWalletChangeRequest(requestId: string): Promise<{ success: boolean }> {
    await delay(800)

    if (typeof window !== "undefined") {
      const allRequests = JSON.parse(localStorage.getItem("wallet_change_requests") || "[]")
      const requestIndex = allRequests.findIndex((req: any) => req.id === requestId)

      if (requestIndex === -1) {
        throw new Error("申请不存在")
      }

      const request = allRequests[requestIndex]
      request.status = "approved"
      request.reviewedAt = new Date().toISOString()
      request.reviewedBy = "admin_user"

      // Update user's wallet address
      const user = mockUsers.find((u) => u.id === request.userId)
      if (user) {
        user.walletAddress = request.newWallet
      }

      localStorage.setItem("wallet_change_requests", JSON.stringify(allRequests))
    }

    return { success: true }
  },

  async rejectWalletChangeRequest(requestId: string): Promise<{ success: boolean }> {
    await delay(800)

    if (typeof window !== "undefined") {
      const allRequests = JSON.parse(localStorage.getItem("wallet_change_requests") || "[]")
      const requestIndex = allRequests.findIndex((req: any) => req.id === requestId)

      if (requestIndex === -1) {
        throw new Error("申请不存在")
      }

      const request = allRequests[requestIndex]
      request.status = "rejected"
      request.reviewedAt = new Date().toISOString()
      request.reviewedBy = "admin_user"

      localStorage.setItem("wallet_change_requests", JSON.stringify(allRequests))
    }

    return { success: true }
  },
}
