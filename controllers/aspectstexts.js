'use strict';

/**
 * ZODIKA • Aspect Texts
 * -------------------------------------------------------------
 *
 * Structure:
 *   TEXTS = {
 *     "planetA|planetB": {
 *        conjunction: "texto...",
 *        opposition: "texto...",
 *        square: "texto...",
 *        trine: "texto...",
 *        sextile: "texto..."
 *     },
 *     ...
 *   };
 *
 * Exemple: "mars|venus", "moon|saturn", "chiron|lilith"
 */

const TEXTS = {

  "moon|sun": {
    conjunction: "sol em conjunção com a lua indica que o que você sente e o que expressa caminham juntos, gerando clareza emocional e autenticidade nas decisões.",
    opposition: "sol em oposição à lua indica conflito entre razão e emoção, pedindo consciência das reações e acordos internos antes de decidir.",
    square: "sol em quadratura com a lua indica atrito entre vontade e sentimento, pedindo pausas antes de agir e autoconsciência emocional.",
    trine: "sol em trígono com a lua indica harmonia entre emoção e razão, favorecendo decisões coerentes e relações equilibradas.",
    sextile: "sol em sextil com a lua indica boa integração entre emoção e ação, favorecendo iniciativas equilibradas e relações sinceras."
  },
  "mercury|sun": {
    conjunction: "sol em conjunção com mercúrio indica que identidade e pensamento andam alinhados, facilitando comunicação direta e escolhas racionais no dia a dia.",
    opposition: "sol em oposição a mercúrio indica tensão entre pensar e agir, pedindo escuta ativa e revisão antes de comunicar decisões.",
    square: "sol em quadratura com mercúrio indica pressa em comunicar, pedindo clareza nas ideias e revisão antes de expor opiniões.",
    trine: "sol em trígono com mercúrio indica clareza mental e expressão fluida, favorecendo comunicação direta e aprendizado contínuo.",
    sextile: "sol em sextil com mercúrio indica comunicação facilitada, favorecendo acordos rápidos e decisões bem informadas."
  },
  "sun|venus": {
    conjunction: "sol em conjunção com vênus indica que expressão e afeto convergem, favorecendo relações claras e decisões guiadas por valores e bem-estar.",
    opposition: "sol em oposição a vênus indica diferença entre querer agradar e afirmar vontades, exigindo equilíbrio entre empatia e autenticidade.",
    square: "sol em quadratura com vênus indica dificuldade em conciliar afeto e autoexpressão, pedindo acordos sinceros e respeito mútuo.",
    trine: "sol em trígono com vênus indica equilíbrio entre vontade e afeto, favorecendo parcerias estáveis e expressão gentil.",
    sextile: "sol em sextil com vênus indica cooperação entre vontade e afeto, favorecendo trocas leves e vínculos saudáveis."
  },
  "mars|sun": {
    conjunction: "sol em conjunção com marte indica que vontade e ação se somam, impulsionando iniciativa assertiva e foco em metas objetivas e mensuráveis.",
    opposition: "sol em oposição a marte indica disputas de direção, pedindo canalização da energia para metas próprias e não para competições.",
    square: "sol em quadratura com marte indica impulsividade e tensão, pedindo foco em objetivos reais e autocontrole antes da ação.",
    trine: "sol em trígono com marte indica energia bem direcionada, favorecendo produtividade e execução eficiente de planos.",
    sextile: "sol em sextil com marte indica energia prática e iniciativa constante, favorecendo começo de projetos e foco produtivo."
  },
  "jupiter|sun": {
    conjunction: "sol em conjunção com júpiter indica que propósito e expansão se reforçam, ampliando visão de longo prazo e estimulando metas ambiciosas com critérios.",
    opposition: "sol em oposição a júpiter indica excesso de confiança ou promessas, pedindo critérios realistas e foco em resultados concretos.",
    square: "sol em quadratura com júpiter indica otimismo sem medida, pedindo prudência financeira e metas alcançáveis.",
    trine: "sol em trígono com júpiter indica otimismo com base real, favorecendo crescimento com propósito e generosidade prática.",
    sextile: "sol em sextil com júpiter indica oportunidades de expansão, favorecendo aprendizado, viagens e conexões úteis."
  },
  "saturn|sun": {
    conjunction: "sol em conjunção com saturno indica que identidade e responsabilidade se integram, sustentando disciplina, limites claros e consistência nas entregas.",
    opposition: "sol em oposição a saturno indica tensão entre autonomia e dever, pedindo gestão equilibrada do tempo e das responsabilidades.",
    square: "sol em quadratura com saturno indica obstáculos à autonomia, pedindo disciplina e paciência para consolidar resultados.",
    trine: "sol em trígono com saturno indica disciplina natural, favorecendo estabilidade, responsabilidade e resultados consistentes.",
    sextile: "sol em sextil com saturno indica apoio entre disciplina e propósito, favorecendo planejamento e cumprimento de metas."
  },
  "sun|uranus": {
    conjunction: "sol em conjunção com urano indica que expressão e inovação caminham juntas, favorecendo mudanças ágeis, testes rápidos e soluções criativas aplicáveis.",
    opposition: "sol em oposição a urano indica conflito entre liberdade e constância, pedindo mudanças planejadas e comunicação transparente.",
    square: "sol em quadratura com urano indica impaciência com regras, pedindo flexibilidade e planejamento antes de romper estruturas.",
    trine: "sol em trígono com urano indica criatividade aplicada, favorecendo inovações práticas e atitudes autênticas.",
    sextile: "sol em sextil com urano indica abertura para inovação, favorecendo mudanças conscientes e soluções originais."
  },
  "neptune|sun": {
    conjunction: "sol em conjunção com netuno indica que vitalidade e imaginação se misturam, pedindo checagem de fatos e tradução de ideias em passos verificáveis.",
    opposition: "sol em oposição a netuno indica idealização excessiva, pedindo clareza nos limites e verificação de fatos antes de agir.",
    square: "sol em quadratura com netuno indica falta de foco e dispersão, pedindo rotinas simples e checagem de realidade.",
    trine: "sol em trígono com netuno indica sensibilidade equilibrada, favorecendo empatia e intuição com base concreta.",
    sextile: "sol em sextil com netuno indica inspiração aplicável, favorecendo empatia, visão criativa e práticas que elevam o propósito."
  },
  "pluto|sun": {
    conjunction: "sol em conjunção com plutão indica que presença e profundidade se intensificam, favorecendo transformações conscientes e uso responsável de influência.",
    opposition: "sol em oposição a plutão indica disputas de poder e controle, pedindo autoconsciência e transparência nas intenções.",
    square: "sol em quadratura com plutão indica atrito com figuras de autoridade, pedindo transformação interna e limites éticos.",
    trine: "sol em trígono com plutão indica poder pessoal consciente, favorecendo mudanças sustentáveis e influência positiva.",
    sextile: "sol em sextil com plutão indica chance de transformação pessoal, favorecendo evolução através de escolhas firmes e éticas."
  },
  "chiron|sun": {
    conjunction: "sol em conjunção com quíron indica que identidade toca feridas e recursos de cura, estimulando autocuidado, aprendizado emocional e serviço útil.",
    opposition: "sol em oposição a quíron indica que autoestima e feridas se confrontam, pedindo autocompaixão e prática de autoafirmação saudável.",
    square: "sol em quadratura com quíron indica dificuldade em se afirmar sem ferir, pedindo expressão firme e empática.",
    trine: "sol em trígono com quíron indica integração entre identidade e cura, favorecendo autoestima e ensino pelo exemplo.",
    sextile: "sol em sextil com quíron indica aprendizado por meio de vulnerabilidades, favorecendo expressão autêntica e acolhimento."
  },
  "north_node|sun": {
    conjunction: "sol em conjunção com o nodo norte indica que propósito pessoal e direção evolutiva se alinham, orientando passos visíveis e metas com sentido.",
    opposition: "sol em oposição ao nodo norte indica conflito entre conforto e propósito, pedindo escolhas alinhadas à evolução pessoal.",
    square: "sol em quadratura com o nodo norte indica conflito entre hábitos e propósito, pedindo ajustes conscientes de rota.",
    trine: "sol em trígono com o nodo norte indica sintonia entre propósito e expressão, favorecendo progresso e reconhecimento natural.",
    sextile: "sol em sextil com o nodo norte indica oportunidade de alinhar propósito e ação, favorecendo progresso com consciência."
  },
  "lilith|sun": {
    conjunction: "sol em conjunção com lilith indica que expressão e autonomia se fortalecem, favorecendo posicionamento claro e definição de fronteiras saudáveis.",
    opposition: "sol em oposição a lilith indica tensão entre desejo de liberdade e necessidade de aprovação, pedindo limites claros e autenticidade.",
    square: "sol em quadratura com lilith indica desafio em sustentar autenticidade, pedindo firmeza e clareza nas escolhas pessoais.",
    trine: "sol em trígono com lilith indica autenticidade firme, favorecendo autonomia e presença confiante.",
    sextile: "sol em sextil com lilith indica chance de expressar autenticidade, favorecendo posicionamento firme sem perder empatia."
  },
  "asc|sun": {
    conjunction: "sol em conjunção com o ascendente indica que essência e presença se alinham, reforçando primeira impressão, autoconfiança e coerência na abordagem.",
    opposition: "sol em oposição ao ascendente indica que imagem e essência podem divergir, pedindo coerência entre discurso e presença.",
    square: "sol em quadratura com o ascendente indica tensão entre essência e imagem, pedindo coerência e cuidado na expressão pessoal.",
    trine: "sol em trígono com o ascendente indica coerência entre essência e imagem, favorecendo carisma e impacto positivo.",
    sextile: "sol em sextil com o ascendente indica harmonia entre identidade e imagem, favorecendo presença confiante e comunicação clara."
  },
  "mc|sun": {
    conjunction: "sol em conjunção com o meio do céu indica que identidade e vocação pública convergem, guiando escolhas de carreira e visibilidade com propósito.",
    opposition: "sol em oposição ao meio do céu indica conflito entre vida pessoal e carreira, pedindo prioridades e acordos com clareza.",
    square: "sol em quadratura com o meio do céu indica esforço para alinhar identidade e carreira, pedindo planejamento realista e constância.",
    trine: "sol em trígono com o meio do céu indica fluidez entre identidade e carreira, favorecendo reconhecimento e visibilidade consistente.",
    sextile: "sol em sextil com o meio do céu indica abertura para crescimento profissional, favorecendo reconhecimento por mérito e consistência."
  },

  "mercury|moon": {
    conjunction: "lua em conjunção com mercúrio indica que emoção e pensamento se fundem, favorecendo comunicação empática e expressão sincera.",
    opposition: "lua em oposição a mercúrio indica desencontro entre emoção e razão, pedindo escuta e tempo antes de responder.",
    square: "lua em quadratura com mercúrio indica dificuldade em expressar emoções, pedindo comunicação simples e escuta ativa.",
    trine: "lua em trígono com mercúrio indica fluidez entre emoção e pensamento, favorecendo conversas sinceras e compreensão mútua.",
    sextile: "lua em sextil com mercúrio indica facilidade para expressar emoções, favorecendo conversas produtivas e trocas sinceras."
  },
  
  "moon|venus": {
    conjunction: "lua em conjunção com vênus indica harmonia entre sentir e gostar, favorecendo vínculos afetivos e conforto emocional nas relações.",
    opposition: "lua em oposição a vênus indica diferença entre necessidade afetiva e expectativa do outro, pedindo diálogo e acordos claros.",
    square: "lua em quadratura com vênus indica conflito entre afeto e segurança, pedindo clareza de valores e cuidado com a carência.",
    trine: "lua em trígono com vênus indica afeto equilibrado, favorecendo trocas afetivas leves e expressão de carinho com naturalidade.",
    sextile: "lua em sextil com vênus indica afeto leve e equilibrado, favorecendo convivência harmoniosa e cuidado mútuo."
  },
  
  "mars|moon": {
    conjunction: "lua em conjunção com marte indica reação intensa e direta, pedindo atenção aos impulsos e canalização saudável da energia.",
    opposition: "lua em oposição a marte indica reações impulsivas e conflitos emocionais, pedindo pausas e foco no que é construtivo.",
    square: "lua em quadratura com marte indica impulsividade emocional, pedindo pausa antes de reagir e foco no essencial.",
    trine: "lua em trígono com marte indica motivação emocional, favorecendo ação inspirada e atitudes coerentes com o sentir.",
    sextile: "lua em sextil com marte indica iniciativa emocional, favorecendo ações corajosas guiadas pela intuição."
  },
  
  "jupiter|moon": {
    conjunction: "lua em conjunção com júpiter indica otimismo emocional e generosidade, favorecendo apoio mútuo e crescimento pessoal.",
    opposition: "lua em oposição a júpiter indica exageros afetivos ou expectativas altas, pedindo moderação e realismo nas promessas.",
    square: "lua em quadratura com júpiter indica excesso de entusiasmo ou drama, pedindo moderação e autocontrole emocional.",
    trine: "lua em trígono com júpiter indica otimismo emocional, favorecendo generosidade e expansão de vínculos positivos.",
    sextile: "lua em sextil com júpiter indica oportunidade de crescimento emocional, favorecendo esperança e otimismo prático."
  },
  
  "moon|saturn": {
    conjunction: "lua em conjunção com saturno indica controle emocional e reservas afetivas, pedindo confiança gradual e segurança nas trocas.",
    opposition: "lua em oposição a saturno indica bloqueio emocional e sensação de solidão, pedindo maturidade e expressão controlada dos sentimentos.",
    square: "lua em quadratura com saturno indica medo de rejeição, pedindo confiança gradual e expressão sincera de necessidades.",
    trine: "lua em trígono com saturno indica maturidade emocional, favorecendo estabilidade e confiança nos relacionamentos.",
    sextile: "lua em sextil com saturno indica equilíbrio entre emoção e responsabilidade, favorecendo confiança e comprometimento."
  },
  
  "moon|uranus": {
    conjunction: "lua em conjunção com urano indica mudanças emocionais súbitas, favorecendo liberdade, mas pedindo estabilidade nas decisões.",
    opposition: "lua em oposição a urano indica instabilidade emocional, pedindo flexibilidade e aceitação das mudanças sem rupturas bruscas.",
    square: "lua em quadratura com urano indica instabilidade afetiva, pedindo flexibilidade sem romper vínculos de forma abrupta.",
    trine: "lua em trígono com urano indica liberdade afetiva, favorecendo mudanças espontâneas e expressão autêntica.",
    sextile: "lua em sextil com urano indica abertura para mudanças, favorecendo adaptação emocional e flexibilidade."
  },
  
  "moon|neptune": {
    conjunction: "lua em conjunção com netuno indica sensibilidade elevada, favorecendo empatia, mas pedindo clareza para evitar ilusões.",
    opposition: "lua em oposição a netuno indica ilusões afetivas e confusão emocional, pedindo discernimento e limites claros.",
    square: "lua em quadratura com netuno indica confusão emocional e fuga da realidade, pedindo rotina e práticas que sustentem o foco.",
    trine: "lua em trígono com netuno indica sensibilidade inspiradora, favorecendo empatia, imaginação e práticas criativas.",
    sextile: "lua em sextil com netuno indica inspiração emocional, favorecendo empatia e sensibilidade artística."
  },
  
  "moon|pluto": {
    conjunction: "lua em conjunção com plutão indica emoções intensas e transformadoras, pedindo autoconsciência e limites para não se sobrecarregar.",
    opposition: "lua em oposição a plutão indica apego e medo de perda, pedindo autodomínio e confiança no próprio valor.",
    square: "lua em quadratura com plutão indica intensidade emocional e controle, pedindo limites e coragem para vulnerabilidade.",
    trine: "lua em trígono com plutão indica profundidade emocional saudável, favorecendo regeneração e confiança nos laços.",
    sextile: "lua em sextil com plutão indica oportunidade de transformação emocional, favorecendo autoconhecimento e vínculos verdadeiros."
  },
  
  "chiron|moon": {
    conjunction: "lua em conjunção com quíron indica contato com feridas emocionais, favorecendo autocompreensão e empatia com os outros.",
    opposition: "lua em oposição a quíron indica que a necessidade de cuidado toca antigas dores, pedindo acolhimento e autoconsciência.",
    square: "lua em quadratura com quíron indica dor ao expressar sentimentos, pedindo empatia e tempo para cicatrização interna.",
    trine: "lua em trígono com quíron indica acolhimento das próprias dores, favorecendo empatia e sabedoria emocional.",
    sextile: "lua em sextil com quíron indica chance de curar padrões afetivos, favorecendo aceitação e equilíbrio interno."
  },
  
  "moon|north_node": {
    conjunction: "lua em conjunção com o nodo norte indica que sentimentos apontam a direção evolutiva, favorecendo decisões guiadas por intuição madura.",
    opposition: "lua em oposição ao nodo norte indica conflito entre passado emocional e futuro desejado, pedindo desprendimento gradual.",
    square: "lua em quadratura com o nodo norte indica resistência ao novo, pedindo desapego do passado e abertura ao aprendizado.",
    trine: "lua em trígono com o nodo norte indica sintonia entre emoção e propósito, favorecendo crescimento pessoal equilibrado.",
    sextile: "lua em sextil com o nodo norte indica oportunidade de alinhar emoção e propósito, favorecendo decisões conscientes."
  },
  
  "lilith|moon": {
    conjunction: "lua em conjunção com lilith indica emoções autênticas e instintivas, favorecendo liberdade afetiva e expressão sem censura.",
    opposition: "lua em oposição a lilith indica tensão entre sensibilidade e autonomia, pedindo expressão emocional sem culpa.",
    square: "lua em quadratura com lilith indica atrito entre emoção e instinto, pedindo respeito aos próprios limites e autonomia.",
    trine: "lua em trígono com lilith indica integração entre sensibilidade e instinto, favorecendo autenticidade emocional.",
    sextile: "lua em sextil com lilith indica harmonia entre instinto e afeto, favorecendo autenticidade nas relações."
  },
  
  "asc|moon": {
    conjunction: "lua em conjunção com o ascendente indica que emoções se tornam visíveis, favorecendo empatia, mas pedindo equilíbrio na exposição.",
    opposition: "lua em oposição ao ascendente indica que sentimentos interferem na forma de se relacionar, pedindo empatia e equilíbrio.",
    square: "lua em quadratura com o ascendente indica dificuldade em equilibrar emoção e aparência, pedindo autenticidade sem excesso.",
    trine: "lua em trígono com o ascendente indica empatia natural, favorecendo boas relações e comunicação afetuosa.",
    sextile: "lua em sextil com o ascendente indica empatia expressiva, favorecendo relações sociais agradáveis e acolhedoras."
  },
  
  "mc|moon": {
    conjunction: "lua em conjunção com o meio do céu indica que emoções influenciam imagem pública, pedindo estabilidade e coerência nas atitudes profissionais.",
    opposition: "lua em oposição ao meio do céu indica tensão entre vida pessoal e demandas públicas, pedindo organização emocional e limites.",
    square: "lua em quadratura com o meio do céu indica interferência emocional no trabalho, pedindo separação entre vida pessoal e metas.",
    trine: "lua em trígono com o meio do céu indica harmonia entre emoções e carreira, favorecendo reconhecimento e estabilidade.",
    sextile: "lua em sextil com o meio do céu indica oportunidade de expressar emoções com maturidade, favorecendo reputação sólida."
  },
  
  "mercury|venus": {
    conjunction: "mercúrio em conjunção com vênus indica que raciocínio e afeto se unem, favorecendo conversas diplomáticas e expressão agradável.",
    opposition: "mercúrio em oposição a vênus indica conflito entre lógica e emoção, pedindo escuta atenta e diplomacia nas conversas.",
    square: "mercúrio em quadratura com vênus indica dificuldade em conciliar mente e emoção, pedindo comunicação sensível e direta.",
    trine: "mercúrio em trígono com vênus indica comunicação agradável e empática, favorecendo parcerias e acordos harmônicos.",
    sextile: "mercúrio em sextil com vênus indica comunicação empática e colaborativa, favorecendo conexões leves e criativas."
  },
  
  "mars|mercury": {
    conjunction: "mercúrio em conjunção com marte indica fala assertiva e mente rápida, pedindo cuidado com impulsividade e clareza na intenção.",
    opposition: "mercúrio em oposição a marte indica tensão verbal e impaciência, pedindo pausas antes de reagir e foco na objetividade.",
    square: "mercúrio em quadratura com marte indica irritação verbal e pressa para responder, pedindo escuta ativa e filtro nas palavras.",
    trine: "mercúrio em trígono com marte indica mente prática e objetiva, favorecendo decisões rápidas e execução eficiente.",
    sextile: "mercúrio em sextil com marte indica expressão objetiva e direta, favorecendo negociações rápidas e decisões firmes."
  },
  
  "jupiter|mercury": {
    conjunction: "mercúrio em conjunção com júpiter indica pensamento expansivo e visão ampla, favorecendo aprendizado, estudos e planejamento de longo prazo.",
    opposition: "mercúrio em oposição a júpiter indica excesso de confiança nas ideias, pedindo revisão de dados e moderação no discurso.",
    square: "mercúrio em quadratura com júpiter indica excesso de opinião e dispersão, pedindo foco e verificação das informações.",
    trine: "mercúrio em trígono com júpiter indica visão ampla e aprendizado fácil, favorecendo estudos e planejamento estratégico.",
    sextile: "mercúrio em sextil com júpiter indica oportunidade de expandir conhecimento, favorecendo trocas construtivas e aprendizado contínuo."
  },
  
  "mercury|saturn": {
    conjunction: "mercúrio em conjunção com saturno indica raciocínio estruturado e comunicação séria, favorecendo foco e consistência nas ideias.",
    opposition: "mercúrio em oposição a saturno indica bloqueio na expressão e autocrítica, pedindo clareza e prática para destravar comunicação.",
    square: "mercúrio em quadratura com saturno indica rigidez mental e autocrítica, pedindo flexibilidade e paciência com aprendizados.",
    trine: "mercúrio em trígono com saturno indica pensamento organizado e disciplinado, favorecendo clareza e confiabilidade nas ideias.",
    sextile: "mercúrio em sextil com saturno indica raciocínio prático e estruturado, favorecendo planejamento e cumprimento de metas."
  },
  
  "mercury|uranus": {
    conjunction: "mercúrio em conjunção com urano indica mente criativa e intuitiva, favorecendo inovação, mas pedindo atenção à dispersão.",
    opposition: "mercúrio em oposição a urano indica pensamentos contraditórios e instáveis, pedindo adaptação sem romper conexões úteis.",
    square: "mercúrio em quadratura com urano indica instabilidade no pensamento, pedindo foco e pausas para revisar ideias novas.",
    trine: "mercúrio em trígono com urano indica mente inventiva e ágil, favorecendo soluções originais e adaptação inteligente.",
    sextile: "mercúrio em sextil com urano indica abertura para novas ideias, favorecendo inovação e adaptação flexível."
  },
  
  "mercury|neptune": {
    conjunction: "mercúrio em conjunção com netuno indica imaginação fértil e sensibilidade mental, pedindo verificação de fatos para evitar confusões.",
    opposition: "mercúrio em oposição a netuno indica risco de ilusões e confusões mentais, pedindo verificação e objetividade constante.",
    square: "mercúrio em quadratura com netuno indica confusão mental e distração, pedindo métodos simples e registros escritos.",
    trine: "mercúrio em trígono com netuno indica imaginação equilibrada e empatia, favorecendo comunicação inspiradora e sensível.",
    sextile: "mercúrio em sextil com netuno indica sensibilidade mental e imaginação equilibrada, favorecendo comunicação intuitiva."
  },
  
  "mercury|pluto": {
    conjunction: "mercúrio em conjunção com plutão indica pensamento profundo e persuasivo, favorecendo análise estratégica e conversas transformadoras.",
    opposition: "mercúrio em oposição a plutão indica disputas intelectuais, pedindo escuta e argumentação sem imposição.",
    square: "mercúrio em quadratura com plutão indica pensamento obsessivo e controle, pedindo leveza e confiança no diálogo.",
    trine: "mercúrio em trígono com plutão indica profundidade e foco mental, favorecendo pesquisas e conversas transformadoras.",
    sextile: "mercúrio em sextil com plutão indica chance de transformação intelectual, favorecendo conversas sinceras e autoconhecimento."
  },
  
  "chiron|mercury": {
    conjunction: "mercúrio em conjunção com quíron indica palavra curativa e consciência das próprias vulnerabilidades, favorecendo comunicação empática.",
    opposition: "mercúrio em oposição a quíron indica dificuldade em se expressar sem dor, pedindo palavras cuidadosas e empatia.",
    square: "mercúrio em quadratura com quíron indica dor em se comunicar, pedindo autoaceitação e espaço para falar com calma.",
    trine: "mercúrio em trígono com quíron indica palavra curativa e empatia verbal, favorecendo diálogo acolhedor e aprendizado emocional.",
    sextile: "mercúrio em sextil com quíron indica diálogo construtivo sobre vulnerabilidades, favorecendo aprendizado e confiança."
  },
  
  "mercury|north_node": {
    conjunction: "mercúrio em conjunção com o nodo norte indica que aprendizado e propósito evolutivo se alinham, favorecendo decisões conscientes.",
    opposition: "mercúrio em oposição ao nodo norte indica pensamentos presos ao passado, pedindo novas referências e atualização mental.",
    square: "mercúrio em quadratura com o nodo norte indica resistência a novos aprendizados, pedindo abertura e curiosidade ativa.",
    trine: "mercúrio em trígono com o nodo norte indica alinhamento entre pensamento e propósito, favorecendo decisões evolutivas.",
    sextile: "mercúrio em sextil com o nodo norte indica oportunidade de alinhar comunicação e propósito, favorecendo evolução pessoal."
  },
  
  "lilith|mercury": {
    conjunction: "mercúrio em conjunção com lilith indica discurso direto e autêntico, favorecendo expressão livre e pensamento independente.",
    opposition: "mercúrio em oposição a lilith indica conflito entre racionalidade e impulso, pedindo autenticidade sem agressividade.",
    square: "mercúrio em quadratura com lilith indica atrito entre expressão livre e aceitação social, pedindo autenticidade com tato.",
    trine: "mercúrio em trígono com lilith indica autenticidade intelectual e coragem para falar verdades com clareza.",
    sextile: "mercúrio em sextil com lilith indica expressão independente e firme, favorecendo autenticidade e pensamento livre."
  },
  
  "asc|mercury": {
    conjunction: "mercúrio em conjunção com o ascendente indica expressão clara e comunicativa, favorecendo contato social e troca de ideias.",
    opposition: "mercúrio em oposição ao ascendente indica desencontro entre pensamento e expressão social, pedindo comunicação mais transparente.",
    square: "mercúrio em quadratura com o ascendente indica ruído entre pensamento e imagem, pedindo clareza e alinhamento entre discurso e atitude.",
    trine: "mercúrio em trígono com o ascendente indica comunicação fluida e natural, favorecendo relações e entendimento social.",
    sextile: "mercúrio em sextil com o ascendente indica facilidade de expressão social, favorecendo acordos e apresentações."
  },
  
  "mc|mercury": {
    conjunction: "mercúrio em conjunção com o meio do céu indica que comunicação apoia carreira, favorecendo clareza profissional e boa reputação.",
    opposition: "mercúrio em oposição ao meio do céu indica conflito entre ideias pessoais e demandas profissionais, pedindo ajustes no tom e foco.",
    square: "mercúrio em quadratura com o meio do céu indica divergência entre ideias e objetivos de carreira, pedindo foco estratégico.",
    trine: "mercúrio em trígono com o meio do céu indica que ideias e carreira caminham juntas, favorecendo reconhecimento por competência.",
    sextile: "mercúrio em sextil com o meio do céu indica oportunidade de reconhecimento profissional por boas ideias e clareza."
  },
  
  "mars|venus": {
    conjunction: "vênus em conjunção com marte indica união entre afeto e desejo, favorecendo relações dinâmicas e atração sincera.",
    opposition: "vênus em oposição a marte indica tensão entre afeto e impulso, pedindo diálogo e equilíbrio entre desejo e empatia.",
    square: "vênus em quadratura com marte indica conflito entre desejo e sensibilidade, pedindo maturidade nas reações afetivas.",
    trine: "vênus em trígono com marte indica equilíbrio entre desejo e afeto, favorecendo relações dinâmicas e respeito mútuo.",
    sextile: "vênus em sextil com marte indica cooperação entre afeto e desejo, favorecendo química e expressão equilibrada."
  },
  
  "jupiter|venus": {
    conjunction: "vênus em conjunção com júpiter indica generosidade afetiva e otimismo, favorecendo relações expansivas e alegria no convívio.",
    opposition: "vênus em oposição a júpiter indica exageros nas relações, pedindo moderação e discernimento no envolvimento emocional.",
    square: "vênus em quadratura com júpiter indica generosidade sem medida, pedindo equilíbrio entre dar e receber nas relações.",
    trine: "vênus em trígono com júpiter indica harmonia e alegria nas relações, favorecendo otimismo e expansão afetiva.",
    sextile: "vênus em sextil com júpiter indica entusiasmo e abertura emocional, favorecendo parcerias e experiências enriquecedoras."
  },
  
  "saturn|venus": {
    conjunction: "vênus em conjunção com saturno indica que afeto precisa de estrutura, favorecendo vínculos estáveis e compromisso consciente.",
    opposition: "vênus em oposição a saturno indica distância afetiva ou medo de rejeição, pedindo paciência e construção gradual de confiança.",
    square: "vênus em quadratura com saturno indica insegurança afetiva, pedindo autovalorização e clareza nas expectativas.",
    trine: "vênus em trígono com saturno indica estabilidade emocional, favorecendo confiança e compromisso duradouro.",
    sextile: "vênus em sextil com saturno indica maturidade afetiva, favorecendo confiança e relacionamentos consistentes."
  },
  
  "uranus|venus": {
    conjunction: "vênus em conjunção com urano indica liberdade nos afetos, favorecendo autenticidade, mas pedindo constância nas relações.",
    opposition: "vênus em oposição a urano indica alternância entre apego e liberdade, pedindo acordos flexíveis e respeito à individualidade.",
    square: "vênus em quadratura com urano indica instabilidade amorosa, pedindo liberdade responsável e constância nas atitudes.",
    trine: "vênus em trígono com urano indica liberdade com afeto, favorecendo autenticidade e vínculos inovadores.",
    sextile: "vênus em sextil com urano indica inovação nos vínculos, favorecendo liberdade e diálogo transparente."
  },
  
  "neptune|venus": {
    conjunction: "vênus em conjunção com netuno indica idealização no amor, favorecendo empatia, mas pedindo realismo e limites claros.",
    opposition: "vênus em oposição a netuno indica ilusões amorosas e descompasso emocional, pedindo honestidade e clareza nas expectativas.",
    square: "vênus em quadratura com netuno indica confusão entre amor e idealização, pedindo discernimento e realidade nas promessas.",
    trine: "vênus em trígono com netuno indica amor sensível e compassivo, favorecendo empatia e idealismo equilibrado.",
    sextile: "vênus em sextil com netuno indica empatia e romantismo equilibrado, favorecendo inspiração e compaixão nos vínculos."
  },
  
  "pluto|venus": {
    conjunction: "vênus em conjunção com plutão indica intensidade emocional e poder de atração, pedindo clareza para evitar jogos de controle.",
    opposition: "vênus em oposição a plutão indica jogos de poder nos vínculos, pedindo transparência e limites firmes para evitar desgaste.",
    square: "vênus em quadratura com plutão indica intensidade e controle emocional, pedindo transparência e limites firmes.",
    trine: "vênus em trígono com plutão indica intensidade saudável e profundidade emocional, favorecendo vínculos transformadores.",
    sextile: "vênus em sextil com plutão indica oportunidade de aprofundar laços, favorecendo confiança e autenticidade."
  },
  
  "chiron|venus": {
    conjunction: "vênus em conjunção com quíron indica cura através das relações, favorecendo empatia e aceitação de imperfeições.",
    opposition: "vênus em oposição a quíron indica dor ligada à autoestima, pedindo acolhimento e relacionamentos baseados em respeito mútuo.",
    square: "vênus em quadratura com quíron indica feridas na forma de se relacionar, pedindo autocuidado e respeito aos próprios limites.",
    trine: "vênus em trígono com quíron indica cura afetiva por meio do acolhimento e de trocas sinceras.",
    sextile: "vênus em sextil com quíron indica chance de curar feridas afetivas, favorecendo expressão sensível e aceitação."
  },
  
  "north_node|venus": {
    conjunction: "vênus em conjunção com o nodo norte indica que o afeto guia o crescimento pessoal, favorecendo vínculos que impulsionam evolução.",
    opposition: "vênus em oposição ao nodo norte indica conflito entre prazer e propósito, pedindo escolhas que unam desejo e crescimento.",
    square: "vênus em quadratura com o nodo norte indica conflito entre prazer e propósito, pedindo escolhas conscientes e sustentáveis.",
    trine: "vênus em trígono com o nodo norte indica alinhamento entre amor e propósito, favorecendo relações que impulsionam evolução.",
    sextile: "vênus em sextil com o nodo norte indica oportunidade de alinhar relacionamentos e propósito, favorecendo conexões significativas."
  },
  
  "lilith|venus": {
    conjunction: "vênus em conjunção com lilith indica autenticidade e independência afetiva, favorecendo relações igualitárias e sinceras.",
    opposition: "vênus em oposição a lilith indica tensão entre necessidade de aceitação e autenticidade, pedindo honestidade afetiva.",
    square: "vênus em quadratura com lilith indica atrito entre desejo e independência, pedindo autenticidade sem rigidez.",
    trine: "vênus em trígono com lilith indica autenticidade afetiva e autonomia, favorecendo relações livres e honestas.",
    sextile: "vênus em sextil com lilith indica harmonia entre desejo e autonomia, favorecendo relações sinceras e equilibradas."
  },
  
  "asc|venus": {
    conjunction: "vênus em conjunção com o ascendente indica carisma e gentileza na presença, favorecendo empatia e boas parcerias.",
    opposition: "vênus em oposição ao ascendente indica necessidade de conciliar harmonia pessoal e expectativas do outro, pedindo diálogo constante.",
    square: "vênus em quadratura com o ascendente indica tensão entre imagem e expressão afetiva, pedindo coerência e transparência.",
    trine: "vênus em trígono com o ascendente indica simpatia natural e boa convivência, favorecendo vínculos e parcerias leves.",
    sextile: "vênus em sextil com o ascendente indica carisma e facilidade social, favorecendo contatos agradáveis e cooperação."
  },
  
  "mc|venus": {
    conjunction: "vênus em conjunção com o meio do céu indica valorização da imagem pública, favorecendo reconhecimento por talento e harmonia.",
    opposition: "vênus em oposição ao meio do céu indica desequilíbrio entre vida afetiva e metas públicas, pedindo acordos de tempo e prioridade.",
    square: "vênus em quadratura com o meio do céu indica conflito entre aparência e essência, pedindo alinhamento entre valores e carreira.",
    trine: "vênus em trígono com o meio do céu indica harmonia entre valores pessoais e imagem pública, favorecendo reconhecimento.",
    sextile: "vênus em sextil com o meio do céu indica valorização profissional e boa imagem, favorecendo reconhecimento por talento e estilo."
  },
  
  "jupiter|mars": {
    conjunction: "marte em conjunção com júpiter indica impulso otimista e confiança em ação, favorecendo crescimento e coragem com propósito.",
    opposition: "marte em oposição a júpiter indica excesso de impulso e risco, pedindo equilíbrio entre entusiasmo e prudência.",
    square: "marte em quadratura com júpiter indica impulso excessivo e pressa, pedindo planejamento e foco em metas realistas.",
    trine: "marte em trígono com júpiter indica energia expansiva e confiança, favorecendo conquistas e visão de longo prazo.",
    sextile: "marte em sextil com júpiter indica oportunidade de crescimento por iniciativa, favorecendo ação otimista e colaborativa."
  },
  
  "mars|saturn": {
    conjunction: "marte em conjunção com saturno indica energia disciplinada e foco, favorecendo execução consistente e paciência estratégica.",
    opposition: "marte em oposição a saturno indica conflito entre ação e limite, pedindo paciência e estratégia para não desperdiçar energia.",
    square: "marte em quadratura com saturno indica bloqueio de energia e frustração, pedindo disciplina e persistência com paciência.",
    trine: "marte em trígono com saturno indica disciplina natural e ação eficiente, favorecendo execução responsável e resultados sólidos.",
    sextile: "marte em sextil com saturno indica energia bem direcionada, favorecendo disciplina, produtividade e foco."
  },
  
  "mars|uranus": {
    conjunction: "marte em conjunção com urano indica ação imprevisível e vontade de ruptura, pedindo flexibilidade e consciência dos riscos.",
    opposition: "marte em oposição a urano indica necessidade de liberdade versus controle, pedindo escolhas conscientes e ritmo moderado.",
    square: "marte em quadratura com urano indica impaciência e ruptura, pedindo calma e flexibilidade para agir com consciência.",
    trine: "marte em trígono com urano indica iniciativa criativa e flexível, favorecendo mudanças práticas e inovação.",
    sextile: "marte em sextil com urano indica disposição para inovar, favorecendo ação criativa e soluções rápidas."
  },
  
  "mars|neptune": {
    conjunction: "marte em conjunção com netuno indica impulso idealista e dispersão, pedindo clareza nas metas e uso construtivo da sensibilidade.",
    opposition: "marte em oposição a netuno indica dispersão e idealismo em excesso, pedindo foco e verificação da realidade antes de agir.",
    square: "marte em quadratura com netuno indica dispersão e cansaço, pedindo descanso e clareza antes de executar.",
    trine: "marte em trígono com netuno indica sensibilidade ativa e propósito, favorecendo ação inspirada e empatia prática.",
    sextile: "marte em sextil com netuno indica sensibilidade ativa, favorecendo empatia nas atitudes e motivação com propósito."
  },
  
  "mars|pluto": {
    conjunction: "marte em conjunção com plutão indica força intensa e transformadora, favorecendo poder de realização com ética e autocontrole.",
    opposition: "marte em oposição a plutão indica disputas de poder e força reativa, pedindo autocontrole e clareza de intenção.",
    square: "marte em quadratura com plutão indica conflito de forças e controle, pedindo domínio interno e foco no essencial.",
    trine: "marte em trígono com plutão indica poder pessoal bem canalizado, favorecendo transformações e liderança consciente.",
    sextile: "marte em sextil com plutão indica poder de transformação, favorecendo iniciativas intensas e regeneração pessoal."
  },
  
  "chiron|mars": {
    conjunction: "marte em conjunção com quíron indica coragem para enfrentar feridas antigas, favorecendo ações terapêuticas e assertividade consciente.",
    opposition: "marte em oposição a quíron indica medo de agir e se ferir, pedindo coragem gradual e atitudes compassivas consigo.",
    square: "marte em quadratura com quíron indica dor ao afirmar vontades, pedindo coragem sensível e ação empática.",
    trine: "marte em trígono com quíron indica coragem terapêutica, favorecendo superação de dores e atitudes construtivas.",
    sextile: "marte em sextil com quíron indica chance de curar padrões de ação, favorecendo atitudes firmes e conscientes."
  },
  
  "mars|north_node": {
    conjunction: "marte em conjunção com o nodo norte indica que ação e propósito se alinham, favorecendo avanços por iniciativa própria.",
    opposition: "marte em oposição ao nodo norte indica conflito entre passado e direção evolutiva, pedindo ajustes no modo de agir.",
    square: "marte em quadratura com o nodo norte indica resistência ao progresso, pedindo revisão de hábitos e foco na direção certa.",
    trine: "marte em trígono com o nodo norte indica alinhamento entre iniciativa e propósito, favorecendo avanço e realização.",
    sextile: "marte em sextil com o nodo norte indica oportunidade de agir conforme o propósito, favorecendo progresso e clareza."
  },
  
  "lilith|mars": {
    conjunction: "marte em conjunção com lilith indica impulso autêntico e rebelde, favorecendo liberdade pessoal e limites claros.",
    opposition: "marte em oposição a lilith indica tensão entre impulso e independência, pedindo expressão firme sem imposição.",
    square: "marte em quadratura com lilith indica atrito entre impulso e autonomia, pedindo ação consciente e respeito aos limites.",
    trine: "marte em trígono com lilith indica autenticidade nas ações, favorecendo autonomia e atitude firme.",
    sextile: "marte em sextil com lilith indica impulso independente e verdadeiro, favorecendo ação autêntica e libertadora."
  },
  
  "asc|mars": {
    conjunction: "marte em conjunção com o ascendente indica presença assertiva e proatividade, favorecendo liderança e ação direta.",
    opposition: "marte em oposição ao ascendente indica atritos nos relacionamentos, pedindo escuta e assertividade equilibrada.",
    square: "marte em quadratura com o ascendente indica impaciência na expressão pessoal, pedindo autocontrole e ritmo saudável.",
    trine: "marte em trígono com o ascendente indica confiança e energia equilibrada, favorecendo liderança e presença.",
    sextile: "marte em sextil com o ascendente indica presença ativa e proatividade, favorecendo cooperação e liderança leve."
  },
  
  "mars|mc": {
    conjunction: "marte em conjunção com o meio do céu indica ambição e determinação, favorecendo reconhecimento por resultados concretos.",
    opposition: "marte em oposição ao meio do céu indica esforço entre ambição e vida pessoal, pedindo prioridade e equilíbrio.",
    square: "marte em quadratura com o meio do céu indica tensão entre esforço e reconhecimento, pedindo estratégia e constância.",
    trine: "marte em trígono com o meio do céu indica determinação profissional e foco, favorecendo conquistas e reconhecimento.",
    sextile: "marte em sextil com o meio do céu indica dinamismo profissional e determinação, favorecendo reconhecimento por esforço."
  },
  
  "jupiter|saturn": {
    conjunction: "júpiter em conjunção com saturno indica equilíbrio entre expansão e estrutura, favorecendo crescimento sólido e metas sustentáveis.",
    opposition: "júpiter em oposição a saturno indica tensão entre otimismo e cautela, pedindo equilíbrio entre ambição e responsabilidade.",
    square: "júpiter em quadratura com saturno indica atrito entre expansão e limite, pedindo paciência e ajustes estruturais.",
    trine: "júpiter em trígono com saturno indica equilíbrio entre fé e método, favorecendo crescimento estável e realizações concretas.",
    sextile: "júpiter em sextil com saturno indica oportunidade de crescer com método, favorecendo disciplina e resultados consistentes."
  },
  
  "jupiter|uranus": {
    conjunction: "júpiter em conjunção com urano indica abertura para mudanças rápidas, favorecendo inovação e decisões visionárias.",
    opposition: "júpiter em oposição a urano indica conflito entre liberdade e estabilidade, pedindo ajustes nas expectativas e nas rotinas.",
    square: "júpiter em quadratura com urano indica impaciência com restrições, pedindo inovação com responsabilidade.",
    trine: "júpiter em trígono com urano indica inovação inspirada e expansão consciente, favorecendo oportunidades de progresso.",
    sextile: "júpiter em sextil com urano indica abertura para novas ideias, favorecendo expansão inteligente e inovação planejada."
  },
  
  "jupiter|neptune": {
    conjunction: "júpiter em conjunção com netuno indica fé e imaginação amplificadas, pedindo realismo e foco para concretizar ideais.",
    opposition: "júpiter em oposição a netuno indica idealismo exagerado, pedindo checagem de fatos e realismo nas decisões.",
    square: "júpiter em quadratura com netuno indica dispersão e idealismo, pedindo foco e checagem de realidade.",
    trine: "júpiter em trígono com netuno indica fé equilibrada e sensibilidade, favorecendo compaixão e idealismo prático.",
    sextile: "júpiter em sextil com netuno indica idealismo equilibrado e inspiração, favorecendo práticas criativas e espirituais."
  },
  
  "jupiter|pluto": {
    conjunction: "júpiter em conjunção com plutão indica poder de transformação e influência, favorecendo estratégias de longo alcance e propósito ético.",
    opposition: "júpiter em oposição a plutão indica disputa de poder e excesso de controle, pedindo humildade e cooperação.",
    square: "júpiter em quadratura com plutão indica excesso de ambição e controle, pedindo ética e clareza de propósito.",
    trine: "júpiter em trígono com plutão indica poder transformador e estratégia, favorecendo crescimento com propósito e ética.",
    sextile: "júpiter em sextil com plutão indica oportunidade de transformar planos em ações sustentáveis e éticas."
  },
  
  "chiron|jupiter": {
    conjunction: "júpiter em conjunção com quíron indica expansão através da cura, favorecendo ensino e autoconhecimento.",
    opposition: "júpiter em oposição a quíron indica que o desejo de ensinar pode revelar feridas, pedindo empatia e escuta antes de orientar.",
    square: "júpiter em quadratura com quíron indica conflito entre fé e dor, pedindo aprendizado com humildade e empatia.",
    trine: "júpiter em trígono com quíron indica sabedoria que cura, favorecendo ensino empático e autodesenvolvimento.",
    sextile: "júpiter em sextil com quíron indica chance de crescimento por meio da vulnerabilidade, favorecendo sabedoria emocional."
  },
  
  "jupiter|north_node": {
    conjunction: "júpiter em conjunção com o nodo norte indica crescimento alinhado ao propósito, favorecendo oportunidades que impulsionam evolução.",
    opposition: "júpiter em oposição ao nodo norte indica resistência a mudanças de rota, pedindo revisão de crenças e atualização de metas.",
    square: "júpiter em quadratura com o nodo norte indica resistência à expansão necessária, pedindo revisão de crenças limitantes.",
    trine: "júpiter em trígono com o nodo norte indica sintonia entre expansão e propósito, favorecendo evolução consciente.",
    sextile: "júpiter em sextil com o nodo norte indica oportunidade de alinhar fé e propósito, favorecendo avanço consciente."
  },
  
  "jupiter|lilith": {
    conjunction: "júpiter em conjunção com lilith indica independência e coragem moral, favorecendo expressão autêntica e pensamento livre.",
    opposition: "júpiter em oposição a lilith indica tensão entre liberdade pessoal e moral coletiva, pedindo expressão sincera com respeito ao outro.",
    square: "júpiter em quadratura com lilith indica tensão entre liberdade e moral, pedindo autenticidade sem imposição.",
    trine: "júpiter em trígono com lilith indica liberdade de pensamento e autenticidade, favorecendo confiança e expressão genuína.",
    sextile: "júpiter em sextil com lilith indica independência intelectual e confiança, favorecendo expressão autêntica."
  },
  
  "asc|jupiter": {
    conjunction: "júpiter em conjunção com o ascendente indica carisma e otimismo natural, favorecendo confiança e abertura social.",
    opposition: "júpiter em oposição ao ascendente indica otimismo excessivo nas relações, pedindo limites e realismo ao lidar com os outros.",
    square: "júpiter em quadratura com o ascendente indica otimismo impulsivo, pedindo coerência entre discurso e ação.",
    trine: "júpiter em trígono com o ascendente indica simpatia e otimismo, favorecendo boas relações e abertura social.",
    sextile: "júpiter em sextil com o ascendente indica facilidade de socialização e comunicação positiva, favorecendo parcerias produtivas."
  },
  
  "jupiter|mc": {
    conjunction: "júpiter em conjunção com o meio do céu indica prestígio e expansão profissional, favorecendo reconhecimento e oportunidades de liderança.",
    opposition: "júpiter em oposição ao meio do céu indica conflito entre carreira e crescimento interno, pedindo redefinição de prioridades.",
    square: "júpiter em quadratura com o meio do céu indica dificuldade em alinhar carreira e propósito, pedindo planejamento e foco.",
    trine: "júpiter em trígono com o meio do céu indica sucesso profissional com propósito, favorecendo visibilidade e crescimento.",
    sextile: "júpiter em sextil com o meio do céu indica progresso profissional e reconhecimento, favorecendo expansão equilibrada."
  },
  
  "saturn|uranus": {
    conjunction: "saturno em conjunção com urano indica união entre tradição e mudança, favorecendo inovação estruturada e equilíbrio entre estabilidade e liberdade.",
    opposition: "saturno em oposição a urano indica conflito entre controle e liberdade, pedindo ajustes para equilibrar inovação e estabilidade.",
    square: "saturno em quadratura com urano indica tensão entre inovação e rotina, pedindo adaptações progressivas e planejamento.",
    trine: "saturno em trígono com urano indica inovação com base sólida, favorecendo mudanças estruturadas e duradouras.",
    sextile: "saturno em sextil com urano indica oportunidade de renovar estruturas, favorecendo inovação gradual e sustentável."
  },
  
  "saturn|neptune": {
    conjunction: "saturno em conjunção com netuno indica sonho com forma e disciplina criativa, favorecendo projetos inspirados com base real.",
    opposition: "saturno em oposição a netuno indica tensão entre sonho e realidade, pedindo planejamento e definição de limites claros.",
    square: "saturno em quadratura com netuno indica dificuldade em manter foco e fé, pedindo disciplina e checagem de realidade.",
    trine: "saturno em trígono com netuno indica harmonia entre sonho e realidade, favorecendo materialização de ideais.",
    sextile: "saturno em sextil com netuno indica integração entre sonho e dever, favorecendo criação com propósito."
  },
  
  "saturn|pluto": {
    conjunction: "saturno em conjunção com plutão indica força transformadora e foco, favorecendo reconstruções duradouras e comprometimento.",
    opposition: "saturno em oposição a plutão indica disputas de poder e rigidez, pedindo desapego e reestruturação consciente.",
    square: "saturno em quadratura com plutão indica resistência à mudança e controle, pedindo revisão de métodos e flexibilidade.",
    trine: "saturno em trígono com plutão indica força interior e disciplina transformadora, favorecendo resultados consistentes.",
    sextile: "saturno em sextil com plutão indica força prática para mudanças profundas, favorecendo estabilidade e foco."
  },
  
  "chiron|saturn": {
    conjunction: "saturno em conjunção com quíron indica maturidade ao lidar com feridas, favorecendo cura por meio da responsabilidade emocional.",
    opposition: "saturno em oposição a quíron indica medo de vulnerabilidade e cobrança emocional, pedindo acolhimento e autocompaixão.",
    square: "saturno em quadratura com quíron indica dor ligada a cobranças e autocrítica, pedindo paciência e compaixão consigo.",
    trine: "saturno em trígono com quíron indica maturidade emocional, favorecendo cura através da responsabilidade e do exemplo.",
    sextile: "saturno em sextil com quíron indica chance de curar padrões de rigidez, favorecendo maturidade emocional e autocontrole."
  },
  
  "north_node|saturn": {
    conjunction: "saturno em conjunção com o nodo norte indica aprendizado sobre limites e compromisso, favorecendo progresso sustentado.",
    opposition: "saturno em oposição ao nodo norte indica resistência à evolução, pedindo coragem para mudar padrões antigos.",
    square: "saturno em quadratura com o nodo norte indica bloqueio no progresso, pedindo persistência e aprendizado gradual.",
    trine: "saturno em trígono com o nodo norte indica alinhamento entre compromisso e propósito, favorecendo progresso sólido.",
    sextile: "saturno em sextil com o nodo norte indica oportunidade de alinhar disciplina e propósito, favorecendo avanços consistentes."
  },
  "lilith|saturn": {
    conjunction: "saturno em conjunção com lilith indica confronto entre autoridade e autonomia, pedindo autenticidade com responsabilidade.",
    opposition: "saturno em oposição a lilith indica repressão da autenticidade, pedindo liberdade com responsabilidade e expressão sincera.",
    square: "saturno em quadratura com lilith indica atrito entre repressão e liberdade, pedindo honestidade e equilíbrio entre regras e instinto.",
    trine: "saturno em trígono com lilith indica autenticidade equilibrada com maturidade, favorecendo autoconfiança e integridade.",
    sextile: "saturno em sextil com lilith indica harmonia entre autonomia e dever, favorecendo liberdade com responsabilidade."
  },
  
  "asc|saturn": {
    conjunction: "saturno em conjunção com o ascendente indica presença reservada e séria, favorecendo respeito e conquistas consistentes.",
    opposition: "saturno em oposição ao ascendente indica dificuldade em se abrir socialmente, pedindo paciência e relacionamentos estruturados.",
    square: "saturno em quadratura com o ascendente indica rigidez na autoimagem, pedindo leveza e confiança para se mostrar ao mundo.",
    trine: "saturno em trígono com o ascendente indica postura confiável e disciplinada, favorecendo respeito e estabilidade nas relações.",
    sextile: "saturno em sextil com o ascendente indica comportamento confiável e estável, favorecendo parcerias e reputação sólida."
  },
  
  "mc|saturn": {
    conjunction: "saturno em conjunção com o meio do céu indica vocação madura e disciplinada, favorecendo reconhecimento por esforço e competência.",
    opposition: "saturno em oposição ao meio do céu indica conflito entre ambição e vida pessoal, pedindo equilíbrio e redefinição de metas.",
    square: "saturno em quadratura com o meio do céu indica obstáculos profissionais, pedindo constância, paciência e aperfeiçoamento.",
    trine: "saturno em trígono com o meio do céu indica realização profissional gradual e segura, favorecendo reconhecimento por mérito.",
    sextile: "saturno em sextil com o meio do céu indica progresso profissional estruturado, favorecendo reconhecimento a longo prazo."
  },
  
  "neptune|uranus": {
    conjunction: "urano em conjunção com netuno indica união entre visão e intuição, favorecendo inspiração criativa e novas formas de pensar.",
    opposition: "urano em oposição a netuno indica conflito entre racional e intuitivo, pedindo equilíbrio entre lógica e fé nas decisões.",
    square: "urano em quadratura com netuno indica confusão entre ideal e realidade, pedindo foco e consistência antes de agir.",
    trine: "urano em trígono com netuno indica harmonia entre intuição e inovação, favorecendo criatividade e visão de futuro.",
    sextile: "urano em sextil com netuno indica inspiração inovadora, favorecendo criatividade aplicada e sensibilidade equilibrada."
  },
  
  "pluto|uranus": {
    conjunction: "urano em conjunção com plutão indica força transformadora e desejo de ruptura, favorecendo renovação profunda e autenticidade.",
    opposition: "urano em oposição a plutão indica tensão entre mudança e controle, pedindo flexibilidade e desapego do passado.",
    square: "urano em quadratura com plutão indica crise de poder e vontade de ruptura, pedindo mudanças graduais e éticas.",
    trine: "urano em trígono com plutão indica poder transformador consciente, favorecendo mudanças sólidas e bem direcionadas.",
    sextile: "urano em sextil com plutão indica oportunidade de transformação positiva, favorecendo ajustes conscientes e evolução pessoal."
  },
  
  "chiron|uranus": {
    conjunction: "urano em conjunção com quíron indica cura por meio da originalidade, favorecendo libertação de padrões antigos.",
    opposition: "urano em oposição a quíron indica resistência à cura emocional, pedindo abertura para novos métodos e autoconhecimento.",
    square: "urano em quadratura com quíron indica dor ligada à liberdade pessoal, pedindo aceitação e novos caminhos de expressão.",
    trine: "urano em trígono com quíron indica libertação emocional por meio da aceitação, favorecendo cura e autenticidade.",
    sextile: "urano em sextil com quíron indica chance de curar padrões antigos por meio da liberdade, favorecendo autodescoberta."
  },
  
  "north_node|uranus": {
    conjunction: "urano em conjunção com o nodo norte indica mudanças rápidas no caminho evolutivo, favorecendo crescimento por inovação.",
    opposition: "urano em oposição ao nodo norte indica instabilidade na trajetória, pedindo foco e paciência para amadurecer o aprendizado.",
    square: "urano em quadratura com o nodo norte indica resistência à mudança de rota, pedindo coragem para seguir o que é autêntico.",
    trine: "urano em trígono com o nodo norte indica progresso natural através da inovação, favorecendo crescimento e independência.",
    sextile: "urano em sextil com o nodo norte indica oportunidade de crescimento por inovação, favorecendo adaptação e progresso."
  },
  
  "lilith|uranus": {
    conjunction: "urano em conjunção com lilith indica rebeldia consciente e desejo de independência, favorecendo expressão autêntica.",
    opposition: "urano em oposição a lilith indica tensão entre liberdade e intimidade, pedindo acordos honestos e limites claros.",
    square: "urano em quadratura com lilith indica rebeldia sem direção, pedindo consciência para transformar instinto em autonomia.",
    trine: "urano em trígono com lilith indica autenticidade firme e mente livre, favorecendo atitudes originais e coragem pessoal.",
    sextile: "urano em sextil com lilith indica liberdade expressiva equilibrada, favorecendo autenticidade e empoderamento."
  },
  
  "asc|uranus": {
    conjunction: "urano em conjunção com o ascendente indica comportamento imprevisível e originalidade marcante, favorecendo autenticidade e novas perspectivas.",
    opposition: "urano em oposição ao ascendente indica relacionamentos instáveis e busca de espaço pessoal, pedindo comunicação transparente.",
    square: "urano em quadratura com o ascendente indica imprevisibilidade na imagem pessoal, pedindo equilíbrio entre espontaneidade e clareza.",
    trine: "urano em trígono com o ascendente indica carisma diferente e estilo próprio, favorecendo renovação e confiança.",
    sextile: "urano em sextil com o ascendente indica presença original e inspiradora, favorecendo relações dinâmicas e criativas."
  },
  
  "mc|uranus": {
    conjunction: "urano em conjunção com o meio do céu indica inovação na carreira e desejo de liberdade profissional, favorecendo escolhas ousadas e visionárias.",
    opposition: "urano em oposição ao meio do céu indica conflito entre independência e reconhecimento, pedindo autenticidade sem isolamento.",
    square: "urano em quadratura com o meio do céu indica instabilidade profissional, pedindo inovação com estratégia e paciência.",
    trine: "urano em trígono com o meio do céu indica sucesso através da inovação, favorecendo reconhecimento por ideias originais.",
    sextile: "urano em sextil com o meio do céu indica abertura profissional para o novo, favorecendo oportunidades inovadoras."
  },

  "neptune|pluto": {
    conjunction: "netuno em conjunção com plutão indica transformação espiritual profunda, favorecendo sensibilidade coletiva e propósito regenerador.",
    opposition: "netuno em oposição a plutão indica conflito entre fé e poder, pedindo ética e consciência sobre a própria influência.",
    square: "netuno em quadratura com plutão indica tensão entre transformação e fé, pedindo discernimento e uso ético do poder.",
    trine: "netuno em trígono com plutão indica intuição profunda e regeneração emocional, favorecendo transformação espiritual.",
    sextile: "netuno em sextil com plutão indica oportunidade de transformação emocional, favorecendo sensibilidade e renovação interior."
  },
  
  "chiron|neptune": {
    conjunction: "netuno em conjunção com quíron indica empatia curativa, favorecendo compreensão emocional e práticas terapêuticas.",
    opposition: "netuno em oposição a quíron indica confusão emocional ligada à dor antiga, pedindo discernimento e compaixão prática.",
    square: "netuno em quadratura com quíron indica dor emocional mal compreendida, pedindo práticas de autocuidado e clareza emocional.",
    trine: "netuno em trígono com quíron indica compaixão e empatia que curam, favorecendo ajuda mútua e sensibilidade equilibrada.",
    sextile: "netuno em sextil com quíron indica chance de cura espiritual, favorecendo empatia, perdão e sabedoria emocional."
  },
  
  "neptune|north_node": {
    conjunction: "netuno em conjunção com o nodo norte indica evolução guiada pela fé e intuição, favorecendo crescimento com propósito.",
    opposition: "netuno em oposição ao nodo norte indica idealização do futuro e dispersão, pedindo foco e clareza no propósito.",
    square: "netuno em quadratura com o nodo norte indica fuga do propósito ou ilusões, pedindo decisões objetivas e consistência.",
    trine: "netuno em trígono com o nodo norte indica fluidez espiritual no caminho evolutivo, favorecendo fé prática e inspiração.",
    sextile: "netuno em sextil com o nodo norte indica oportunidade de alinhar intuição e propósito, favorecendo crescimento com significado."
  },
  
  "lilith|neptune": {
    conjunction: "netuno em conjunção com lilith indica sensibilidade instintiva e imaginação rebelde, favorecendo expressão criativa e livre.",
    opposition: "netuno em oposição a lilith indica tensão entre sensibilidade e instinto, pedindo integração entre empatia e autonomia.",
    square: "netuno em quadratura com lilith indica atrito entre fantasia e instinto, pedindo equilíbrio entre sonho e realidade.",
    trine: "netuno em trígono com lilith indica harmonia entre imaginação e instinto, favorecendo expressão criativa e livre.",
    sextile: "netuno em sextil com lilith indica imaginação livre e instintiva, favorecendo expressão criativa e sensibilidade autêntica."
  },
  
  "asc|neptune": {
    conjunction: "netuno em conjunção com o ascendente indica presença empática e intuitiva, favorecendo carisma e conexão emocional com o ambiente.",
    opposition: "netuno em oposição ao ascendente indica dificuldade em se mostrar com clareza, pedindo autenticidade e limites saudáveis.",
    square: "netuno em quadratura com o ascendente indica autoimagem confusa, pedindo autenticidade e clareza de intenção.",
    trine: "netuno em trígono com o ascendente indica magnetismo sutil e empatia, favorecendo relações inspiradoras e presença acolhedora.",
    sextile: "netuno em sextil com o ascendente indica empatia expressiva e carisma discreto, favorecendo conexões humanas e colaboração."
  },
  
  "mc|neptune": {
    conjunction: "netuno em conjunção com o meio do céu indica vocação sensível e inspiradora, favorecendo carreiras ligadas à arte, cuidado ou espiritualidade.",
    opposition: "netuno em oposição ao meio do céu indica confusão profissional ou idealismo excessivo, pedindo realismo e foco prático.",
    square: "netuno em quadratura com o meio do céu indica falta de direção profissional, pedindo metas claras e rotina disciplinada.",
    trine: "netuno em trígono com o meio do céu indica vocação compassiva e criativa, favorecendo reconhecimento por sensibilidade e inspiração.",
    sextile: "netuno em sextil com o meio do céu indica oportunidade de seguir vocação inspiradora, favorecendo reconhecimento por empatia e visão artística."
  },
  
  "chiron|pluto": {
    conjunction: "plutão em conjunção com quíron indica poder de cura profunda, favorecendo transformação emocional e regeneração interior.",
    opposition: "plutão em oposição a quíron indica conflito entre poder e vulnerabilidade, pedindo equilíbrio entre força e empatia.",
    square: "plutão em quadratura com quíron indica dor ligada à perda ou controle, pedindo aceitação e transformação consciente.",
    trine: "plutão em trígono com quíron indica força regeneradora e sabedoria emocional, favorecendo cura e transformação com propósito.",
    sextile: "plutão em sextil com quíron indica oportunidade de cura e fortalecimento interior, favorecendo autoconhecimento e evolução."
  },
  
  "north_node|pluto": {
    conjunction: "plutão em conjunção com o nodo norte indica evolução intensa e transformadora, favorecendo mudanças que direcionam o destino.",
    opposition: "plutão em oposição ao nodo norte indica resistência a mudanças evolutivas, pedindo desapego e coragem para renascer.",
    square: "plutão em quadratura com o nodo norte indica resistência ao crescimento, pedindo coragem para enfrentar o desconforto da mudança.",
    trine: "plutão em trígono com o nodo norte indica evolução natural e poderosa, favorecendo progresso por meio da autotransformação.",
    sextile: "plutão em sextil com o nodo norte indica chance de crescimento por meio da mudança, favorecendo transformação consciente."
  },
  
  "lilith|pluto": {
    conjunction: "plutão em conjunção com lilith indica força instintiva e desejo de autonomia, favorecendo empoderamento e autoconhecimento.",
    opposition: "plutão em oposição a lilith indica tensão entre controle e liberdade, pedindo clareza e honestidade emocional.",
    square: "plutão em quadratura com lilith indica atrito entre poder e autenticidade, pedindo maturidade para usar força sem dominação.",
    trine: "plutão em trígono com lilith indica autenticidade intensa e poder pessoal equilibrado, favorecendo autoconfiança.",
    sextile: "plutão em sextil com lilith indica empoderamento equilibrado e autoconhecimento, favorecendo expressão verdadeira e firme."
  },
  
  "asc|pluto": {
    conjunction: "plutão em conjunção com o ascendente indica presença magnética e intensa, favorecendo transformação pessoal e influência natural.",
    opposition: "plutão em oposição ao ascendente indica desafios nas relações e poder de influência, pedindo transparência e autodomínio.",
    square: "plutão em quadratura com o ascendente indica intensidade na expressão pessoal, pedindo autoconsciência e equilíbrio emocional.",
    trine: "plutão em trígono com o ascendente indica presença forte e magnética, favorecendo influência positiva e mudanças construtivas.",
    sextile: "plutão em sextil com o ascendente indica oportunidade de mudança pessoal e fortalecimento da presença."
  },
  
  "mc|pluto": {
    conjunction: "plutão em conjunção com o meio do céu indica poder profissional e impacto público, favorecendo liderança e transformação de sistemas.",
    opposition: "plutão em oposição ao meio do céu indica conflito entre ambição e vida pessoal, pedindo equilíbrio e reestruturação interna.",
    square: "plutão em quadratura com o meio do céu indica crises profissionais ou mudanças forçadas, pedindo reinvenção e paciência estratégica.",
    trine: "plutão em trígono com o meio do céu indica transformação profissional bem direcionada, favorecendo liderança e propósito.",
    sextile: "plutão em sextil com o meio do céu indica transformação gradual na carreira, favorecendo influência positiva e reconhecimento."
  },

  "chiron|north_node": {
    conjunction: "quíron em conjunção com o nodo norte indica evolução através da cura, favorecendo aprendizado por meio da vulnerabilidade.",
    opposition: "quíron em oposição ao nodo norte indica conflito entre dor passada e propósito futuro, pedindo aceitação e perdão.",
    square: "quíron em quadratura com o nodo norte indica bloqueio na evolução emocional, pedindo coragem para enfrentar dores antigas.",
    trine: "quíron em trígono com o nodo norte indica harmonia entre aprendizado e evolução, favorecendo crescimento por meio da empatia.",
    sextile: "quíron em sextil com o nodo norte indica oportunidade de curar padrões antigos, favorecendo evolução emocional."
  },
  
  "chiron|lilith": {
    conjunction: "quíron em conjunção com lilith indica cura pela autenticidade, favorecendo libertação de culpas e aceitação pessoal.",
    opposition: "quíron em oposição a lilith indica tensão entre ferida e independência, pedindo equilíbrio entre vulnerabilidade e força.",
    square: "quíron em quadratura com lilith indica atrito entre ferida e liberdade, pedindo expressão sincera e aceitação de imperfeições.",
    trine: "quíron em trígono com lilith indica integração entre dor e liberdade, favorecendo expressão emocional autêntica e curativa.",
    sextile: "quíron em sextil com lilith indica chance de unir sensibilidade e autonomia, favorecendo aceitação e autenticidade."
  },
  
  "asc|chiron": {
    conjunction: "quíron em conjunção com o ascendente indica presença sensível e empática, favorecendo conexões humanas e compreensão profunda.",
    opposition: "quíron em oposição ao ascendente indica dificuldade em mostrar fragilidades, pedindo autenticidade e abertura nas relações.",
    square: "quíron em quadratura com o ascendente indica autocrítica e insegurança, pedindo autocompaixão e coragem para se mostrar.",
    trine: "quíron em trígono com o ascendente indica empatia natural e sensibilidade nas relações, favorecendo apoio e compreensão.",
    sextile: "quíron em sextil com o ascendente indica capacidade de acolher o outro e inspirar confiança, favorecendo vínculos humanos."
  },
  
  "chiron|mc": {
    conjunction: "quíron em conjunção com o meio do céu indica vocação ligada ao cuidado e à escuta, favorecendo contribuição social significativa.",
    opposition: "quíron em oposição ao meio do céu indica conflito entre vocação e sensibilidade, pedindo alinhamento entre trabalho e propósito.",
    square: "quíron em quadratura com o meio do céu indica medo de falhar publicamente, pedindo leveza e propósito real nas escolhas profissionais.",
    trine: "quíron em trígono com o meio do céu indica vocação curativa e compassiva, favorecendo reconhecimento por ajudar os outros.",
    sextile: "quíron em sextil com o meio do céu indica oportunidade de transformar dor em propósito, favorecendo carreira com sentido."
  },
  
  "lilith|north_node": {
    conjunction: "nodo norte em conjunção com lilith indica evolução por meio da autenticidade, favorecendo libertação de padrões e coragem de ser quem se é.",
    opposition: "nodo norte em oposição a lilith indica conflito entre liberdade e destino, pedindo equilíbrio entre autenticidade e direção evolutiva.",
    square: "nodo norte em quadratura com lilith indica resistência ao próprio poder, pedindo coragem para assumir autenticidade e responsabilidade.",
    trine: "nodo norte em trígono com lilith indica crescimento através da autonomia, favorecendo autenticidade e expressão livre.",
    sextile: "nodo norte em sextil com lilith indica oportunidade de integrar liberdade e propósito, favorecendo evolução com autenticidade."
  },
  
  "asc|north_node": {
    conjunction: "nodo norte em conjunção com o ascendente indica caminho de crescimento pessoal visível, favorecendo autoconfiança e liderança natural.",
    opposition: "nodo norte em oposição ao ascendente indica tensão entre crescimento pessoal e relacionamentos, pedindo cooperação e empatia.",
    square: "nodo norte em quadratura com o ascendente indica dificuldade em expressar o verdadeiro eu, pedindo autoconhecimento e firmeza.",
    trine: "nodo norte em trígono com o ascendente indica evolução pessoal fluida, favorecendo autoconfiança e boas oportunidades.",
    sextile: "nodo norte em sextil com o ascendente indica oportunidade de crescimento pessoal, favorecendo relações equilibradas e progresso."
  },
  
  "mc|north_node": {
    conjunction: "nodo norte em conjunção com o meio do céu indica destino ligado à vocação e propósito público, favorecendo reconhecimento e realização.",
    opposition: "nodo norte em oposição ao meio do céu indica conflito entre propósito interno e imagem pública, pedindo reavaliação de prioridades.",
    square: "nodo norte em quadratura com o meio do céu indica desafio em alinhar carreira e propósito, pedindo foco e constância nas metas.",
    trine: "nodo norte em trígono com o meio do céu indica harmonia entre destino e vocação, favorecendo reconhecimento e propósito claro.",
    sextile: "nodo norte em sextil com o meio do céu indica chance de alinhar propósito e carreira, favorecendo reconhecimento e avanço."
  },

  "asc|lilith": {
    conjunction: "lilith em conjunção com o ascendente indica presença marcante e autêntica, favorecendo expressão livre e confiança pessoal.",
    opposition: "lilith em oposição ao ascendente indica tensão entre independência e convivência, pedindo equilíbrio entre liberdade e empatia nas relações.",
    square: "lilith em quadratura com o ascendente indica dificuldade em expressar autenticidade sem atrito, pedindo firmeza e sensibilidade na postura pessoal.",
    trine: "lilith em trígono com o ascendente indica autenticidade natural e presença magnética, favorecendo relações sinceras e espontâneas.",
    sextile: "lilith em sextil com o ascendente indica oportunidade de expressar autenticidade com leveza, favorecendo confiança e boas conexões."
  },
  
  "lilith|mc": {
    conjunction: "lilith em conjunção com o meio do céu indica independência profissional e coragem para seguir o próprio caminho, favorecendo autenticidade e visibilidade.",
    opposition: "lilith em oposição ao meio do céu indica conflito entre autenticidade e expectativas externas, pedindo coerência entre valores e imagem pública.",
    square: "lilith em quadratura com o meio do céu indica atrito entre liberdade e reputação, pedindo coragem para se posicionar com verdade e ética.",
    trine: "lilith em trígono com o meio do céu indica harmonia entre independência e propósito, favorecendo sucesso por autenticidade.",
    sextile: "lilith em sextil com o meio do céu indica oportunidade de alinhar liberdade e carreira, favorecendo reconhecimento por originalidade."
  }
};


module.exports = { TEXTS };
