import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ING_TS = join(process.cwd(), 'src', 'data', 'ingredients.ts')

// New ingredients to add
const NEW_INGREDIENTS = [
  // 蔬菜
  { name: '香菜', category: '蔬菜', alias: ['芫荽'], description: '香菜是常见的调味蔬菜，具有独特的清香，常用于凉拌、汤品和炒菜的提味。', tips: '挑选叶片鲜绿、茎部挺拔的香菜，闻起来香味浓郁为佳。', storage: '用保鲜袋包好冷藏，根部朝下可延长保鲜期。', pairings: ['牛肉', '豆腐', '辣椒', '蒜'] },
  { name: '包菜', category: '蔬菜', alias: ['卷心菜', '圆白菜', '甘蓝'], description: '包菜是常见的叶菜类蔬菜，口感脆嫩，适合炒、凉拌、做泡菜等多种烹饪方式。', tips: '挑选包心紧实、叶片有光泽、手感沉甸甸的。', storage: '整颗冷藏可保存1-2周，切开后需密封冷藏。', pairings: ['五花肉', '干辣椒', '蒜', '粉丝'] },
  { name: '菜心', category: '蔬菜', alias: ['菜薹', '广东菜心'], description: '菜心是粤菜中常见的绿叶蔬菜，茎秆脆嫩，花薹清甜，清炒或白灼即可。', tips: '挑选茎秆粗壮、花蕾未开、叶片翠绿的。', storage: '冷藏保存，用湿纸巾包裹根部可保鲜3-5天。', pairings: ['蒜', '蚝油', '姜'] },
  { name: '蒜苔', category: '蔬菜', alias: ['蒜薹', '蒜苗'], description: '蒜苔是大蒜的花茎，口感脆嫩，带有蒜香味，适合炒肉或凉拌。', tips: '挑选色泽翠绿、茎秆挺直、花苞紧实的为佳。', storage: '冷藏保存，用保鲜袋密封可保鲜一周。', pairings: ['猪肉', '腊肉', '鸡蛋'] },
  { name: '青蒜', category: '蔬菜', alias: ['青蒜苗'], description: '青蒜是未成熟的大蒜植株，有清香微辣的口感，常用于炒菜提味。', tips: '挑选叶片翠绿、茎部白嫩的，避免叶片发黄的。', storage: '冷藏保存，用保鲜袋包好可保存3-5天。', pairings: ['猪肉', '豆腐', '腊肉'] },
  { name: '泡椒', category: '蔬菜', alias: ['泡辣椒'], description: '泡椒是经过泡制的辣椒，酸辣可口，是川菜中重要的调味食材。', tips: '挑选色泽鲜红、泡制汤汁清澈的为佳。', storage: '密封冷藏保存，避免污染可保存数月。', pairings: ['鸡胗', '牛蛙', '鱼', '猪肉'] },
  { name: '彩椒', category: '蔬菜', alias: ['甜椒', '灯笼椒'], description: '彩椒是甜椒的变种，有红黄橙绿等多种颜色，口感甜脆，适合凉拌、炒菜或做配饰。', tips: '挑选色泽鲜艳、果皮光滑、果柄翠绿的。', storage: '冷藏可保存一周，保持干燥以免腐烂。', pairings: ['牛肉', '虾仁', '鸡蛋'] },
  { name: '剁椒', category: '蔬菜', alias: ['剁辣椒'], description: '剁椒是湖南特色调味料，新鲜辣椒剁碎加盐腌制，鲜辣爽口。', tips: '挑选色泽鲜红、颗粒分明的剁椒为佳。', storage: '冰箱冷藏保存，防止污染可保存数月。', pairings: ['鱼头', '排骨', '豆腐'] },
  { name: '酸萝卜', category: '蔬菜', alias: ['泡萝卜'], description: '酸萝卜是经过泡制的萝卜，酸脆可口，常用于开胃小菜或炒菜调味。', tips: '挑选色泽洁白、口感脆爽、酸味纯正的。', storage: '密封冷藏保存，避免污染。', pairings: ['鸭', '鱼', '猪肉'] },
  { name: '马蹄', category: '蔬菜', alias: ['荸荠'], description: '马蹄是水生植物的球茎，肉质洁白脆甜，既可生食也可做菜、做甜品。', tips: '挑选个大、皮薄、表面紫红、无破损的。', storage: '冷藏可保存一周，去皮的需浸泡在水中冷藏。', pairings: ['排骨', '虾仁', '猪肉'] },
  { name: '冬笋', category: '蔬菜', alias: ['笋'], description: '冬笋是冬季采摘的竹笋，肉质细嫩，味道鲜美，是高档烹饪食材。', tips: '挑选外壳完整、切口新鲜、无霉斑的。', storage: '带壳冷藏可保存一周，去皮后需焯水再保存。', pairings: ['猪肉', '火腿', '香菇'] },
  { name: '蒲菜', category: '蔬菜', alias: ['蒲笋'], description: '蒲菜是香蒲的嫩茎，口感脆嫩，清香可口，是江南地区的特色蔬菜。', tips: '挑选色泽洁白、茎秆嫩脆的。', storage: '冷藏保存，尽快食用以保证鲜嫩。', pairings: ['虾仁', '猪肉'] },
  { name: '梅干菜', category: '蔬菜', alias: ['梅菜', '霉干菜'], description: '梅干菜是经过腌制晒干的芥菜，咸香浓郁，最经典的用法是梅菜扣肉。', tips: '挑选色泽乌黑、干燥、无异味的。', storage: '密封干燥处保存，可保存数月。', pairings: ['五花肉', '猪肉'] },
  { name: '枸杞', category: '蔬菜', alias: ['枸杞子'], description: '枸杞是药食同源的食材，色泽红润，味甘，常用于煲汤、泡茶或入菜。', tips: '挑选颗粒饱满、色泽暗红、无硫熏痕迹的。', storage: '密封干燥处保存，避免受潮变软。', pairings: ['鸽子', '鸡', '排骨'] },

  // 肉类
  { name: '牛肉', category: '肉类', alias: ['牛瘦肉'], description: '牛肉是最常见红肉之一，富含蛋白质和铁，适合炖、炒、煮等多种烹饪方式。', tips: '挑选色泽鲜红、纹理细腻、脂肪洁白的牛肉。', storage: '冷藏可保存1-2天，冷冻可保存3-6个月。', pairings: ['土豆', '胡萝卜', '番茄', '洋葱', '芹菜'] },
  { name: '牛肉末', category: '肉类', alias: ['牛肉馅', '碎牛肉'], description: '牛肉绞碎制成的肉末，适合做肉丸、饺子馅、酱料等。', tips: '挑选肥瘦比例适中(80/20)的牛肉末口感最佳。', storage: '冷藏1天内使用，冷冻可保存1个月。', pairings: ['洋葱', '番茄', '面条'] },
  { name: '牛舌', category: '肉类', alias: [], description: '牛舌是牛的舌头部位，肉质细腻嫩滑，适合卤制、烤制或炖煮。', tips: '挑选色泽粉红、表面光滑、无异味的牛舌。', storage: '冷冻保存，使用前需充分解冻。', pairings: ['八角', '桂皮', '花椒', '酱油'] },
  { name: '牛肚', category: '肉类', alias: ['牛百叶'], description: '牛肚是牛的胃部，口感爽脆有嚼劲，是火锅和凉拌菜的经典食材。', tips: '挑选色泽洁白或淡黄、表面干燥、无异味的。', storage: '冷冻保存，解冻后需彻底清洗处理。', pairings: ['辣椒油', '香菜', '芝麻酱'] },
  { name: '牛蛙', category: '肉类', alias: ['田鸡', '活蛙'], description: '牛蛙肉质细嫩洁白，口感似鸡肉，是川菜和湘菜常用的食材。', tips: '挑选肌肉饱满、有弹性、无异味的。', storage: '冷冻保存，使用前解冻。', pairings: ['泡椒', '干辣椒', '花椒', '姜', '蒜'] },
  { name: '猪腰', category: '肉类', alias: ['猪肾'], description: '猪腰是猪的肾脏，肉质嫩滑，适合爆炒或做汤，需去腥处理。', tips: '挑选色泽红润、表面光滑、无异味的。', storage: '冷藏1天内使用，去筋后食用口感更好。', pairings: ['姜', '蒜', '料酒', '胡椒粉'] },
  { name: '午餐肉', category: '肉类', alias: [], description: '午餐肉是罐头肉制品，方便储存和使用，适合煎、炒、火锅等。', tips: '挑选知名品牌，检查罐头无凹陷膨胀。', storage: '未开封常温保存，开封后冷藏并尽快食用。', pairings: ['鸡蛋', '面条', '火锅底料'] },
  { name: '腊肠', category: '肉类', alias: ['香肠', '腊味'], description: '腊肠是经过腌制风干的肠制品，风味浓郁，是广式和川式烹饪的重要食材。', tips: '挑选外表干燥、色泽红润、肠衣完整的。', storage: '冷藏或冷冻保存，可保存数月。', pairings: ['米饭', '菜心', '荷兰豆'] },
  { name: '腊肉', category: '肉类', alias: ['腊味'], description: '腊肉是经过腌制熏制的猪肉，咸香味浓，适合蒸、炒、炖。', tips: '挑选色泽红润、肥瘦相间、无异味的。', storage: '冷藏或冷冻保存，可保存数月。', pairings: ['蒜苔', '青蒜', '豆干', '米饭'] },
  { name: '腊鱼', category: '肉类', alias: ['风鱼'], description: '腊鱼是经过腌制风干的鱼，咸香紧实，适合蒸食或炒菜。', tips: '挑选鱼身干燥、色泽正常、无异味的。', storage: '冷冻保存，食用前浸泡去咸。', pairings: ['辣椒', '豆豉', '蒜'] },
  { name: '鸡肉', category: '肉类', alias: [], description: '鸡肉是常见的禽肉类，肉质细嫩低脂，适合多种烹饪方式。', tips: '挑选色泽粉红、肉质有弹性、无淤血的。', storage: '冷藏1-2天，冷冻可保存3-6个月。', pairings: ['香菇', '土豆', '青椒', '姜'] },
  { name: '咸肉', category: '肉类', alias: ['腌肉'], description: '咸肉是用盐腌制保存的猪肉，咸香入味，适合炖汤和蒸食。', tips: '挑选肉质紧实、色泽正常、无哈喇味的。', storage: '冷藏保存，过咸可浸泡去盐后烹饪。', pairings: ['竹笋', '豆腐', '冬瓜'] },
  { name: '三黄鸡', category: '肉类', alias: ['走地鸡'], description: '三黄鸡是中国传统的肉鸡品种，肉质紧实鲜美，适合白切、清蒸、炖汤。', tips: '挑选活鸡时看鸡冠鲜红、羽毛光亮，宰杀好的看皮黄肉紧。', storage: '冷冻保存，烹饪前充分解冻。', pairings: ['姜', '葱', '沙姜', '酱油'] },
  { name: '鸽子', category: '肉类', alias: ['乳鸽'], description: '鸽肉低脂高蛋白，肉质细嫩鲜美，适合炖汤或烤制，是滋补佳品。', tips: '挑选肌肉饱满、皮色光亮的。', storage: '冷冻保存，烹饪前解冻。', pairings: ['枸杞', '红枣', '党参', '姜'] },
  { name: '甲鱼', category: '肉类', alias: ['鳖', '团鱼'], description: '甲鱼是传统的滋补食材，肉质鲜美，裙边富含胶质，适合炖汤。', tips: '挑选活力强、无伤痕、腹部不泛红的。', storage: '鲜活保存或宰杀后冷冻。', pairings: ['枸杞', '姜', '料酒'] },
  { name: '鸭血', category: '肉类', alias: ['血豆腐'], description: '鸭血是鸭的血液凝固而成的食材，口感嫩滑，常用于火锅和毛血旺。', tips: '挑选色泽暗红、质地细腻、无异味的。', storage: '冷藏保存，浸泡在清水中可保鲜2-3天。', pairings: ['毛肚', '黄喉', '火锅底料', '辣椒'] },
  { name: '毛肚', category: '肉类', alias: ['牛肚'], description: '毛肚是牛瓣胃的加工品，表面有绒毛状突起，是重庆火锅的灵魂食材。', tips: '挑选色泽自然、表面毛刺分明、泡发适中的。', storage: '冷冻保存，使用时解冻即可涮烫。', pairings: ['火锅底料', '香油', '蒜', '辣椒'] },
  { name: '黄喉', category: '肉类', alias: [], description: '黄喉是猪或牛的大动脉血管，口感脆嫩，是火锅和川菜的特色食材。', tips: '挑选色泽洁白或浅黄、质地脆嫩的。', storage: '冷冻保存，使用前解冻。', pairings: ['火锅底料', '辣椒', '毛肚', '鸭血'] },
  { name: '鸡胗', category: '肉类', alias: ['鸡肫'], description: '鸡胗是鸡的肌胃，口感脆嫩有嚼劲，适合爆炒、卤制或烧烤。', tips: '挑选色泽红润、质地紧实、无异味的。', storage: '冷冻保存，烹饪前去膜处理口感更佳。', pairings: ['泡椒', '辣椒', '蒜', '姜'] },
  { name: '鸡心', category: '肉类', alias: [], description: '鸡心是鸡的心脏，肉质紧实，适合爆炒或烧烤。', tips: '挑选色泽深红、表面光滑、无异味的。', storage: '冷冻保存，烹饪前去血管。', pairings: ['辣椒', '孜然', '蒜'] },
  { name: '鸡肝', category: '肉类', alias: [], description: '鸡肝是鸡的肝脏，口感细腻，富含铁和维生素A，适合爆炒或做酱。', tips: '挑选色泽深红、质地细腻、无异味的。', storage: '冷冻保存，烹饪前去筋膜。', pairings: ['葱', '姜', '料酒', '酱油'] },
  { name: '猪血丸子', category: '肉类', alias: ['血豆腐'], description: '猪血丸子是湖南特色食材，用猪血、豆腐、猪肉制成的丸子，烟熏风味独特。', tips: '挑选色泽深黑、表面干燥、熏香味浓的。', storage: '冷冻保存，烹饪前切片。', pairings: ['辣椒', '蒜', '青蒜'] },
  { name: '蛋饺', category: '肉类', alias: [], description: '蛋饺是以蛋皮包裹肉馅的食材，金黄美观，常用于火锅或汤品。', tips: '挑选蛋皮完整、馅料饱满的。', storage: '冷冻保存，烹饪时无需解冻。', pairings: ['火锅底料', '鸡汤', '粉丝'] },

  // 水产
  { name: '鳜鱼', category: '水产', alias: ['桂鱼', '桂花鱼'], description: '鳜鱼是中国传统的名贵淡水鱼，肉质细嫩鲜美，适合清蒸，是松鼠鳜鱼的主料。', tips: '挑选眼球饱满、鳞片完整、鱼身有弹性的。', storage: '冷藏1-2天，冷冻可保存1个月。', pairings: ['姜', '葱', '料酒', '蒸鱼豉油'] },
  { name: '银鱼', category: '水产', alias: ['白鱼'], description: '银鱼体小透明，肉质细嫩无骨，适合煎蛋、做汤或炒食。', tips: '挑选色泽银白透明、个体完整的。', storage: '冷冻保存，烹饪时无需解冻。', pairings: ['鸡蛋', '葱', '姜'] },
  { name: '鱼头', category: '水产', alias: [], description: '鱼头是鱼的头部分，富含胶质和DHA，适合炖汤或剁椒蒸制。', tips: '挑选鱼眼饱满清亮、鱼鳃鲜红的鱼头。', storage: '冷冻保存，使用前解冻。', pairings: ['剁椒', '豆腐', '姜', '葱'] },
  { name: '鲍鱼', category: '水产', alias: [], description: '鲍鱼是名贵海产品，肉质Q弹，味道鲜美，适合清蒸或红烧。', tips: '挑选吸附力强、肉质饱满的活鲍鱼为佳。', storage: '冷藏保存鲜活鲍鱼，干鲍密封干燥保存。', pairings: ['鸡汤', '蚝油', '姜'] },
  { name: '干贝', category: '水产', alias: ['瑶柱'], description: '干贝是扇贝闭壳肌的干制品，鲜味浓郁，是煲汤和做菜的重要提鲜食材。', tips: '挑选颗粒完整、色泽金黄、干燥的干贝。', storage: '密封冷藏或冷冻保存，可保存数月。', pairings: ['冬瓜', '豆腐', '萝卜'] },
  { name: '香螺', category: '水产', alias: ['海螺'], description: '香螺是常见的海产螺类，肉质紧实鲜美，适合白灼或凉拌。', tips: '挑选螺壳完整、触之能缩回的为活螺。', storage: '冷藏保存，烹饪前吐沙处理。', pairings: ['姜', '醋', '蒜'] },
  { name: '海蚌', category: '水产', alias: [], description: '海蚌是经济贝类，肉质鲜嫩，适合做汤或蒸制。', tips: '挑选贝壳闭合紧密、触之能闭合的活蚌。', storage: '冷藏保存，吐沙后烹饪。', pairings: ['姜', '葱', '粉丝'] },
  { name: '海参', category: '水产', alias: [], description: '海参是名贵滋补海产品，富含胶原蛋白，适合炖汤或红烧。', tips: '干海参挑选质地坚硬、刺形完整的；即食海参看包装日期。', storage: '干海参密封干燥保存；即食海参冷冻。', pairings: ['鸡汤', '鲍鱼', '香菇', '葱'] },

  // 豆制品
  { name: '香干', category: '豆制品', alias: ['熏干', '五香豆腐干'], description: '香干是经过卤制调味的豆腐干，风味浓郁，口感紧实，适合炒菜或凉拌。', tips: '挑选色泽均匀、质地紧实、香味浓郁的。', storage: '冷藏保存，浸泡水中可保鲜3-5天。', pairings: ['芹菜', '青椒', '腊肉', '辣椒'] },

  // 禽蛋
  { name: '蛋清', category: '禽蛋', alias: ['蛋白'], description: '蛋清是鸡蛋的蛋白部分，富含蛋白质，用于上浆、挂糊、或制作蛋白类菜品。', tips: '选新鲜鸡蛋分离蛋清，蛋清浓稠不散为佳。', storage: '冷藏密封保存，可保存2-3天。', pairings: ['虾仁', '鸡肉', '淀粉'] },

  // 主食
  { name: '米饭', category: '主食', alias: ['大米饭', '隔夜米饭'], description: '米饭是日常主食，隔夜米饭水分少，特别适合做炒饭。', tips: '隔夜米饭需要冷藏保存，炒饭前用手捏散方便炒制。', storage: '冷藏保存2-3天，冷冻可保存1-3个月。', pairings: ['鸡蛋', '火腿', '虾仁', '葱'] },
  { name: '粉丝', category: '主食', alias: ['粉条', '细粉'], description: '粉丝是以淀粉为原料制成的透明丝状食品，口感Q滑，适合凉拌、煲汤或炒制。', tips: '挑选色泽洁白透明、条干均匀、无碎条的。', storage: '干燥处保存，可保存数月。', pairings: ['蒜', '辣椒', '海鲜', '蔬菜'] },

  // 调味品
  { name: '淀粉', category: '调味品', alias: ['生粉', '地瓜粉', '玉米淀粉'], description: '淀粉是烹饪中重要的辅助食材，用于上浆、勾芡、挂糊，使食材口感嫩滑。', tips: '常用玉米淀粉、马铃薯淀粉、地瓜粉，各有适用场景。', storage: '密封干燥处保存，防潮防虫。', pairings: ['肉', '虾仁', '蛋清'] },
  { name: '沙姜', category: '调味品', alias: ['山柰'], description: '沙姜是广东地区常用的香料，有独特的清香，是白切鸡蘸料的重要成分。', tips: '挑选外皮完整、质地坚实、香味浓郁的。', storage: '冷藏保存新鲜沙姜，沙姜粉干燥密封保存。', pairings: ['鸡', '花生', '酱油'] },
  { name: '蒸鱼豉油', category: '调味品', alias: ['鱼露'], description: '蒸鱼豉油是专门用于蒸鱼的调味酱油，鲜咸适中，不会掩盖鱼肉的鲜美。', tips: '挑选品牌产品，注意查看配料表。', storage: '开封后冷藏保存。', pairings: ['鱼', '姜', '葱'] },
  { name: '芥末', category: '调味品', alias: ['芥辣', '芥末酱'], description: '芥末是辛辣调味料，有独特的冲鼻辣感，常用于刺身、凉拌菜的调味。', tips: '绿芥末（山葵）和黄芥末风味不同，按需选择。', storage: '密封冷藏保存。', pairings: ['生蚝', '三文鱼', '酱油'] },
  { name: '松子', category: '调味品', alias: ['松仁'], description: '松子是松树的种子仁，口感香脆，富含油脂，适合炒菜或做甜点。', tips: '挑选颗粒饱满、色泽金黄、无异味的。', storage: '密封冷藏保存，防止油脂氧化变味。', pairings: ['玉米', '鳜鱼', '虾仁'] },
  { name: '龙井茶叶', category: '调味品', alias: ['茶叶'], description: '龙井茶是中国名茶，色泽翠绿，清香味醇，可用于制作龙井虾仁等茶入菜肴。', tips: '挑选色泽翠绿、外形扁平光滑、有板栗香的。', storage: '密封冷藏保存，避免受潮和异味。', pairings: ['虾仁', '鸡肉'] },
  { name: '荷叶', category: '调味品', alias: [], description: '荷叶清香独特，常用于包裹食材蒸制，给食物赋予荷香风味。', tips: '干燥荷叶挑选完整无破损、色泽自然、有清香的。', storage: '干燥密封保存，可保存数月。', pairings: ['鸡', '糯米', '排骨'] },
  { name: '蒸肉粉', category: '调味品', alias: ['米粉'], description: '蒸肉粉是用米粉和香料制成的粉蒸肉专用粉料，使肉类蒸制后口感软糯香浓。', tips: '挑选粉质细腻、调味适中的蒸肉粉。', storage: '密封干燥处保存。', pairings: ['五花肉', '排骨', '牛肉'] },
  { name: '甜辣酱', category: '调味品', alias: [], description: '甜辣酱是东南亚风格的调味酱，甜辣适中，适合蘸食或炒菜调味。', tips: '挑选色泽自然、口味均衡的品牌产品。', storage: '开封后冷藏保存。', pairings: ['虾', '鸡肉'] },
  { name: '红糟', category: '调味品', alias: ['酒糟'], description: '红糟是福建特色的酿制红曲酒的副产品，色泽红润，酒香浓郁，是闽菜的灵魂调料。', tips: '挑选色泽红润、酒香味浓郁、质地细腻的。', storage: '冷藏密封保存。', pairings: ['猪肉', '鸡', '鱼', '海蚌'] },
  { name: '沙茶酱', category: '调味品', alias: [], description: '沙茶酱是闽南和潮汕地区的特色调味酱，复合香料味浓郁，适合蘸食、炒菜或火锅。', tips: '挑选色泽深棕、香味浓郁、口感沙绵的品牌产品。', storage: '开封后冷藏保存。', pairings: ['牛肉', '海鲜', '豆腐'] },
  { name: '蜂蜜', category: '调味品', alias: ['蜜糖'], description: '蜂蜜是天然甜味品，用于调味、腌制或烘焙，也可冲水饮用。', tips: '挑选色泽自然、有花香、不结晶过度的纯蜂蜜。', storage: '密封常温保存，避免进水导致变质。', pairings: ['柠檬', '柚子', '鸡翅'] },
  { name: '白芝麻', category: '调味品', alias: ['芝麻'], description: '白芝麻是常见的香料和装饰食材，炒香后香气浓郁，用于凉拌、撒面或做酱料。', tips: '挑选颗粒饱满、色泽均匀、无杂质的。', storage: '密封冷藏保存，炒熟后尽快使用。', pairings: ['香油', '辣椒油'] },
  { name: '葛粉', category: '调味品', alias: ['葛根粉'], description: '葛粉是从葛根中提取的淀粉，口感Q弹透明，适合做甜品或羹汤勾芡。', tips: '挑选粉质细腻、色泽洁白的为佳。', storage: '密封干燥处保存。', pairings: ['糖', '枸杞', '银耳'] },

  // 汤料
  { name: '鸡汤', category: '调味品', alias: ['高汤', '上汤'], description: '鸡汤是烹饪中重要的汤底，鲜味浓郁，是许多菜肴的基底。', tips: '自制鸡汤选老母鸡效果最佳，也可使用鸡汤块替代。', storage: '冷藏3天，冷冻可保存1-3个月。', pairings: ['海参', '鲍鱼', '蔬菜'] },
]

async function main() {
  // Load current ingredients
  const ingMod = await import('file:///C:/Users/23371/Desktop/sp/sp/src/data/ingredients.ts?t=' + Date.now())
  const ingredients = ingMod.ingredients

  const maxId = Math.max(...ingredients.map(i => parseInt(i.id.replace('ing-', ''))))
  let nextId = maxId + 1

  // Build new entries as TS text
  let newEntries = '\n'
  for (const ing of NEW_INGREDIENTS) {
    const aliasStr = ing.alias.length > 0 ? `['${ing.alias.join("', '")}']` : '[]'
    const pairingsStr = `[${ing.pairings.map(p => `'${p}'`).join(', ')}]`
    newEntries += `  {
    id: 'ing-${nextId}',
    name: '${ing.name}',
    alias: ${aliasStr},
    category: '${ing.category}',
    description: '${ing.description}',
    tips: '${ing.tips}',
    storage: '${ing.storage}',
    pairings: ${pairingsStr},
    relatedRecipeIds: [],
    image: 'PLACEHOLDER'
  },
`
    nextId++
  }

  // Read the original file
  let txt = readFileSync(ING_TS, 'utf-8')

  // Find the closing "];" and insert before it
  // Look for the pattern: a closing "]" preceded by whitespace
  const closingMatch = txt.match(/\n\]\s*$/)
  if (!closingMatch) {
    console.error('Could not find closing bracket pattern')
    console.error('Last 100 chars:', txt.slice(-100))
    process.exit(1)
  }

  const insertIdx = txt.length - closingMatch[0].length
  const newTxt = txt.slice(0, insertIdx) + newEntries + txt.slice(insertIdx)

  writeFileSync(ING_TS, newTxt)

  console.log(`Added ${NEW_INGREDIENTS.length} new ingredients (ing-${maxId + 1} to ing-${nextId - 1})`)
  console.log(`Total ingredients: ${maxId + NEW_INGREDIENTS.length}`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
