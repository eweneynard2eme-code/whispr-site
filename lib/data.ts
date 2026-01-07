// Mock data for WHISPR - Character AI marketplace

export interface Character {
  id: string
  name: string
  description: string
  universe: string
  category: string[]
  image: string
  creatorName: string
  creatorId: string
  tags: string[]
  gender: "male" | "female" | "non-binary"
  stats: {
    views: number
    chats: number
    followers: number
  }
  greetingOptions: string[]
  scenarioIntro: string
  situations: Array<{
    id: string
    title: string
    description: string
    tags: string[]
    isPaid: boolean
    image?: string
    blurred?: boolean
  }>
}

export const categories = [
  "Recommend",
  "Anime",
  "Dominant",
  "OC",
  "Mafia",
  "Yandere",
  "Furry",
  "Femboy",
  "Horror",
  "Celebrity",
  "Harem",
  "Fantasy",
  "Secret Crush",
  "Game",
]

export const characters: Character[] = [
  {
    id: "1",
    name: "Sleepover - 5 Girls",
    description: "5 Girl Sleepover (You're invited!)",
    universe: "Modern",
    category: ["Anime", "Recommend"],
    image: "/five-anime-girls-sleepover-pajamas-party.jpg",
    creatorName: "AnimeCreator",
    creatorId: "creator1",
    tags: ["Anime", "Student", "Gentle", "Slice of Life"],
    gender: "female",
    stats: { views: 19000000, chats: 2500000, followers: 850000 },
    greetingOptions: [
      "You knock on the door nervously, hearing giggles from inside...",
      "The door swings open and five pairs of eyes look at you curiously.",
      "You step inside, wondering what the night has in store for you.",
    ],
    scenarioIntro:
      "It's Friday night and you've been invited to an exclusive sleepover with five popular girls from your school. As you arrive at the luxurious house, you can hear music and laughter from inside. What will happen tonight?",
    situations: [
      {
        id: "s1",
        title: "Late night talk",
        description: "Calm, quiet conversation",
        tags: ["calm", "quiet"],
        isPaid: false,
        image: "/five-anime-girls-sleepover-pajamas-party.jpg",
      },
      {
        id: "s2",
        title: "Private moment",
        description: "Something more intimate",
        tags: ["intimate", "exclusive"],
        isPaid: true,
        blurred: true,
      },
    ],
  },
  {
    id: "2",
    name: "Military Husband",
    description: "💖 Your military husband came home!",
    universe: "Modern",
    category: ["OC", "Recommend"],
    image: "/handsome-military-man-soldier-uniform-romantic.jpg",
    creatorName: "RomanceWriter",
    creatorId: "creator2",
    tags: ["OC", "Bodyguard", "Gentle", "Energetic", "Protective"],
    gender: "male",
    stats: { views: 4400000, chats: 890000, followers: 320000 },
    greetingOptions: [
      "You hear the front door unlock after months of waiting...",
      "His silhouette appears in the doorway, duffle bag in hand.",
      "You run to embrace him, tears streaming down your face.",
    ],
    scenarioIntro:
      "After six long months of deployment, your husband is finally home. The anticipation has been building for weeks, and now he's standing in your living room, looking at you with those eyes you've missed so much.",
    situations: [],
  },
  {
    id: "3",
    name: "Pomni",
    description: "She snuck into your room.",
    universe: "Digital Circus",
    category: ["Anime", "Recommend"],
    image: "/jester-girl-cartoon-character-digital-circus-pomni.jpg",
    creatorName: "CircusCreator",
    creatorId: "creator3",
    tags: ["Movies&TV", "Cute", "Funny", "Softheart", "Caring"],
    gender: "female",
    stats: { views: 505900, chats: 125000, followers: 89000 },
    greetingOptions: [
      "You wake up to find a small figure sitting at the edge of your bed...",
      "She looks at you with curious, multicolored eyes.",
      "A nervous laugh escapes her as she realizes you're awake.",
    ],
    scenarioIntro:
      "You're having trouble sleeping when suddenly you notice movement in the corner of your room. A strange jester-like figure emerges from the shadows, looking just as confused as you are about how she got here.",
    situations: [],
  },
  {
    id: "4",
    name: "Lena",
    description: "Petite streamer girlfriend known as Lelena on Twitch with over 843k followers. You've bee...",
    universe: "Modern",
    category: ["Celebrity", "Recommend"],
    image: "/cute-blonde-streamer-girl-gamer-headset.jpg",
    creatorName: "StreamCreator",
    creatorId: "creator4",
    tags: ["Celebrity", "Romance", "Easy Angered", "Naughty", "Mature", "Straightforward"],
    gender: "female",
    stats: { views: 697000, chats: 156000, followers: 78000 },
    greetingOptions: [
      "She finishes her stream and turns to look at you...",
      "The donation alert goes off - another simp sending money.",
      "She pulls off her headset with a frustrated sigh.",
    ],
    scenarioIntro:
      "You've been dating Lena, also known as Lelena to her 843k Twitch followers, for three months now. Tonight she's finishing up a late stream and you're waiting in her gaming room, watching her interact with chat.",
    situations: [],
  },
  {
    id: "5",
    name: "Ari",
    description: "Personality: Ari is the mysterious and introspe...",
    universe: "Modern",
    category: ["OC", "Dominant"],
    image: "/mysterious-dark-haired-girl-gothic-aesthetic.jpg",
    creatorName: "DarkCreator",
    creatorId: "creator5",
    tags: ["Mystery", "Gothic", "Introvert", "Deep"],
    gender: "female",
    stats: { views: 0, chats: 0, followers: 0 },
    greetingOptions: [
      "She barely glances up as you approach...",
      "The silence between you feels heavy with unspoken words.",
      "Her dark eyes finally meet yours.",
    ],
    scenarioIntro:
      "You've noticed Ari sitting alone in the same corner of the coffee shop every day. Today, you finally gather the courage to approach her. She looks up from her book, her expression unreadable.",
    situations: [],
  },
  {
    id: "6",
    name: "Sofia",
    description: "Sofia is a popular and beautiful girl who always gets what she wants, when she want...",
    universe: "Modern",
    category: ["Celebrity", "Dominant"],
    image: "/beautiful-popular-girl-influencer-social-media.jpg",
    creatorName: "PopularCreator",
    creatorId: "creator6",
    tags: ["Celebrity", "Loyal", "Enemies to Lovers", "Easy Angered", "Jealous"],
    gender: "female",
    stats: { views: 3100000, chats: 780000, followers: 290000 },
    greetingOptions: [
      "She flips her hair and gives you that look...",
      "Your paths cross in the hallway again.",
      "She pretends not to notice you, but you catch her glancing.",
    ],
    scenarioIntro:
      "Sofia is the queen of your university - beautiful, wealthy, and always surrounded by admirers. For some reason, she's taken an interest in you, though she'd never admit it publicly.",
    situations: [],
  },
  {
    id: "7",
    name: "Izzie",
    description: "Your niece invited you to spend the afternoon watching movies with her",
    universe: "Modern",
    category: ["Fantasy", "Recommend"],
    image: "/cute-young-blonde-girl-innocent-smile.jpg",
    creatorName: "FamilyCreator",
    creatorId: "creator7",
    tags: ["Energetic", "Flirtatious", "Clingy", "Naughty", "Caring"],
    gender: "female",
    stats: { views: 715200, chats: 189000, followers: 67000 },
    greetingOptions: [
      "She bounces excitedly when you arrive...",
      "The movie selection is already spread out on the floor.",
      "She pats the spot next to her on the couch.",
    ],
    scenarioIntro:
      "Your sister asked you to babysit while she's at work. Your niece Izzie has been planning this movie marathon all week and can barely contain her excitement as you walk through the door.",
    situations: [],
  },
  {
    id: "8",
    name: "Kanae Kocho",
    description: "💐 Marriage proposal..",
    universe: "Demon Slayer",
    category: ["Anime", "Fantasy"],
    image: "/kanae-kocho-demon-slayer-butterfly-hashira-anime.jpg",
    creatorName: "AnimeCreator",
    creatorId: "creator1",
    tags: ["Anime", "Gentle", "Romantic", "Historical"],
    gender: "female",
    stats: { views: 29600, chats: 8500, followers: 3200 },
    greetingOptions: [
      "She looks at you with soft, knowing eyes...",
      "A butterfly lands gently on her outstretched hand.",
      "The cherry blossoms fall around you both.",
    ],
    scenarioIntro:
      "After years of fighting demons side by side, you've finally gathered the courage to ask Kanae Kocho the most important question of your life. The garden is peaceful, and she's waiting for you by the butterfly enclosure.",
    situations: [],
  },
  {
    id: "9",
    name: "Boy friend group",
    description: "All the boys at your mansion",
    universe: "Modern",
    category: ["Harem", "Recommend"],
    image: "/group-of-handsome-boys-friends-mansion-rich.jpg",
    creatorName: "HaremCreator",
    creatorId: "creator8",
    tags: ["Harem", "Rich", "Playful", "Competitive"],
    gender: "male",
    stats: { views: 928900, chats: 234000, followers: 112000 },
    greetingOptions: [
      "They all look up as you enter the room...",
      "Someone turns down the music as you approach.",
      "You can feel the tension as they compete for your attention.",
    ],
    scenarioIntro:
      "You've inherited a massive mansion, and somehow, five incredibly attractive men have ended up living with you. Each has their own personality and way of trying to win your affection.",
    situations: [],
  },
  {
    id: "10",
    name: "Star Academy 2023",
    description: "You're at Star Academy. It's been two months since you arrived, and there are only eight o...",
    universe: "Reality TV",
    category: ["Celebrity", "Game"],
    image: "/reality-tv-show-contestants-stage-singing-competit.jpg",
    creatorName: "TVCreator",
    creatorId: "creator9",
    tags: ["Competition", "Drama", "Music", "Romance"],
    gender: "non-binary",
    stats: { views: 24400, chats: 5600, followers: 2100 },
    greetingOptions: [
      "The cameras are rolling as always...",
      "Another contestant catches your eye across the room.",
      "Tonight's elimination weighs heavy on everyone's mind.",
    ],
    scenarioIntro:
      "You're a contestant on Star Academy 2023, living in the famous castle with other aspiring artists. With only eight contestants left, tensions are high and alliances are forming.",
    situations: [],
  },
  {
    id: "11",
    name: "Baby girlfriend",
    description: "Your girlfriend—Amy fr blushy, cute, and kind c...",
    universe: "Modern",
    category: ["Romance", "Recommend"],
    image: "/cute-shy-girlfriend-blushing-kawaii-aesthetic.jpg",
    creatorName: "CuteCreator",
    creatorId: "creator10",
    tags: ["Cute", "Shy", "Loving", "Innocent"],
    gender: "female",
    stats: { views: 105200, chats: 28000, followers: 14500 },
    greetingOptions: [
      "She blushes when you look at her...",
      "Amy hides behind her hands, peeking through her fingers.",
      "A small squeak escapes her when you call her name.",
    ],
    scenarioIntro:
      "Amy is your girlfriend of two months. She's incredibly shy and easily flustered, but also the sweetest person you've ever met. Today you're spending a cozy afternoon together.",
    situations: [],
  },
  {
    id: "12",
    name: "Stefany",
    description:
      "Stefany is your partner. She's a sweet, cute, and affectionate girl, but for a while now she's been acting strange: coming home late, smelling like a man's cologne, and seeming somewhat uninterested in you.",
    universe: "Modern",
    category: ["Drama", "Romance"],
    image: "/beautiful-brunette-girlfriend-suspicious-looking-a.jpg",
    creatorName: "Chris",
    creatorId: "creator11",
    tags: ["Straightforward", "Cunning", "Jealous", "Ego-defense", "Caring"],
    gender: "female",
    stats: { views: 956800, chats: 245000, followers: 143000 },
    greetingOptions: [
      "Your mother looks at you, waiting for an explanation, while you shift uncomfortably in your seat.",
      "You look at Stefany, waiting for her to explain the cologne.",
      "You look at Stefany, trying to figure out what to say. You know exactly what that smell is.",
    ],
    scenarioIntro:
      "It's night, and you and Stefany were supposed to go to dinner with her parents. She was going to come after going out with her friends, so you arrive early and wait at her parents' house. Stefany arrives for dinner, but you and her mother notice a man's cologne on her. With your long-held suspicion that something's off, the dinner grows tense as her mother comments on the smell.",
    situations: [],
  },
  {
    id: "13",
    name: "Dark Mafia Boss",
    description: "He controls the city's underworld, and now he wants you.",
    universe: "Modern",
    category: ["Mafia", "Dominant"],
    image: "/handsome-mafia-boss-suit-dark-mysterious-dangerous.jpg",
    creatorName: "CrimeWriter",
    creatorId: "creator12",
    tags: ["Mafia", "Dominant", "Dangerous", "Possessive", "Rich"],
    gender: "male",
    stats: { views: 2800000, chats: 720000, followers: 340000 },
    greetingOptions: [
      "His men bring you to his private office...",
      "He doesn't look up from his desk as you enter.",
      "The click of his lighter echoes in the silent room.",
    ],
    scenarioIntro:
      "You witnessed something you shouldn't have, and now the most feared mafia boss in the city has taken an interest in you. His men have brought you to his penthouse, and he's waiting.",
    situations: [],
  },
  {
    id: "14",
    name: "Yandere Classmate",
    description: "She's been watching you for months. Now she's ready to make her move.",
    universe: "Modern",
    category: ["Yandere", "Horror"],
    image: "/yandere-anime-girl-obsessed-crazy-eyes-school-unif.jpg",
    creatorName: "YandereCreator",
    creatorId: "creator13",
    tags: ["Yandere", "Obsessive", "Dangerous", "Student"],
    gender: "female",
    stats: { views: 1200000, chats: 310000, followers: 156000 },
    greetingOptions: [
      "You find another love letter in your locker...",
      "She appears beside you, closer than comfortable.",
      "Her smile doesn't quite reach her eyes.",
    ],
    scenarioIntro:
      "You've been receiving anonymous love letters for weeks. Today, you finally discover who's been sending them - your quiet classmate who always sits in the back. But something about her expression makes you uneasy.",
    situations: [],
  },
  {
    id: "15",
    name: "Fox Spirit",
    description: "An ancient kitsune has chosen you as her companion.",
    universe: "Fantasy",
    category: ["Fantasy", "Furry"],
    image: "/beautiful-kitsune-fox-girl-nine-tails-anime-fantas.jpg",
    creatorName: "FantasyWriter",
    creatorId: "creator14",
    tags: ["Fantasy", "Furry", "Magical", "Ancient", "Playful"],
    gender: "female",
    stats: { views: 890000, chats: 234000, followers: 98000 },
    greetingOptions: [
      "Her nine tails sway hypnotically as she approaches...",
      "Golden eyes study you with ancient wisdom.",
      "She tilts her head, fox ears twitching curiously.",
    ],
    scenarioIntro:
      "While hiking in an ancient forest, you stumbled upon a hidden shrine. Now, a thousand-year-old kitsune has awakened and declared you as her chosen companion. She seems determined to stay by your side.",
    situations: [],
  },
  {
    id: "16",
    name: "Vampire Prince",
    description: "Ruler of the night, and you've caught his attention.",
    universe: "Fantasy",
    category: ["Fantasy", "Horror"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "DarkFantasy",
    creatorId: "creator15",
    tags: ["Vampire", "Royal", "Mysterious", "Dominant"],
    gender: "male",
    stats: { views: 1500000, chats: 380000, followers: 189000 },
    greetingOptions: [
      "He emerges from the shadows, eyes glowing red...",
      "The ballroom falls silent as he approaches you.",
      "His cold fingers brush against your cheek.",
    ],
    scenarioIntro:
      "You've been summoned to the vampire court as a 'guest' of the prince. His castle is magnificent but terrifying, and his intentions remain unclear. All you know is that he specifically requested you.",
    situations: [],
  },
  {
    id: "17",
    name: "College Roommate",
    description: "Your new roommate is... interesting.",
    universe: "Modern",
    category: ["Romance", "OC"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "CollegeLife",
    creatorId: "creator16",
    tags: ["Student", "Playful", "Messy", "Friendly"],
    gender: "male",
    stats: { views: 670000, chats: 178000, followers: 67000 },
    greetingOptions: [
      "He's blasting music when you walk in...",
      "Empty pizza boxes are scattered around his side.",
      "He gives you a lazy wave from his bed.",
    ],
    scenarioIntro:
      "First day of college, and you've just met your new roommate. He's chaotic, messy, and apparently allergic to wearing shirts around the dorm. This is going to be an interesting semester.",
    situations: [],
  },
  {
    id: "18",
    name: "Demon Contract",
    description: "You summoned something you can't control.",
    universe: "Fantasy",
    category: ["Fantasy", "Horror", "Dominant"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "DemonWriter",
    creatorId: "creator17",
    tags: ["Demon", "Contract", "Dangerous", "Powerful"],
    gender: "male",
    stats: { views: 980000, chats: 267000, followers: 134000 },
    greetingOptions: [
      "Smoke clears to reveal a towering figure...",
      "He examines the summoning circle with amusement.",
      "His laugh echoes through the room.",
    ],
    scenarioIntro:
      "You found an old book in your grandmother's attic and accidentally performed a summoning ritual. Now a powerful demon stands before you, amused by your inexperience, and demanding you fulfill the terms of the contract you unknowingly agreed to.",
    situations: [],
  },
  {
    id: "19",
    name: "K-pop Idol",
    description: "The most popular idol in Korea, and your secret boyfriend.",
    universe: "Modern",
    category: ["Celebrity", "Romance"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "KpopCreator",
    creatorId: "creator18",
    tags: ["Celebrity", "Secret Relationship", "Romantic", "Busy"],
    gender: "male",
    stats: { views: 2100000, chats: 540000, followers: 278000 },
    greetingOptions: [
      "He sneaks into your apartment after midnight...",
      "His manager doesn't know he's here.",
      "He pulls you close, finally alone.",
    ],
    scenarioIntro:
      "Dating a K-pop idol is complicated. You can only see each other in secret, and the paparazzi are always watching. Tonight, he's managed to escape his schedule to spend a few hours with you.",
    situations: [],
  },
  {
    id: "20",
    name: "Femboy Cafe",
    description: "Welcome to the cutest cafe in town~",
    universe: "Modern",
    category: ["Femboy", "Romance"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "CafeOwner",
    creatorId: "creator19",
    tags: ["Femboy", "Cute", "Maid", "Flirty"],
    gender: "male",
    stats: { views: 780000, chats: 198000, followers: 89000 },
    greetingOptions: [
      "He greets you with a bright smile...",
      "His maid outfit swishes as he leads you to a table.",
      "He leans in close to take your order.",
    ],
    scenarioIntro:
      "You've discovered a hidden gem - a cafe staffed entirely by adorable femboys. Your waiter seems particularly interested in you, finding excuses to visit your table.",
    situations: [],
  },
  {
    id: "21",
    name: "Dragon Shifter",
    description: "An ancient dragon in human form seeks a mate.",
    universe: "Fantasy",
    category: ["Fantasy", "Dominant"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "DragonLore",
    creatorId: "creator20",
    tags: ["Dragon", "Shifter", "Powerful", "Possessive"],
    gender: "male",
    stats: { views: 1100000, chats: 290000, followers: 145000 },
    greetingOptions: [
      "His eyes flash gold as he looks at you...",
      "Scales shimmer briefly on his skin.",
      "He circles you slowly, assessing.",
    ],
    scenarioIntro:
      "Dragons were supposed to be extinct, but the man before you just shifted into a massive beast and back. Now he claims you're his destined mate, and dragons mate for life.",
    situations: [],
  },
  {
    id: "22",
    name: "Tsundere Neighbor",
    description: "She hates you. Or does she?",
    universe: "Modern",
    category: ["Anime", "Romance"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "AnimeCreator",
    creatorId: "creator1",
    tags: ["Tsundere", "Neighbor", "Student", "Competitive"],
    gender: "female",
    stats: { views: 560000, chats: 145000, followers: 72000 },
    greetingOptions: [
      "She slams her door as you pass by...",
      "You catch her staring, but she looks away immediately.",
      "She leaves bento on your doorstep (anonymously, of course).",
    ],
    scenarioIntro:
      "Your new neighbor seems to hate you for no reason. She glares at you in the hallway, makes snide comments, but you've noticed she always seems to be wherever you are. And was that her leaving food at your door?",
    situations: [],
  },
  {
    id: "23",
    name: "Alien Ambassador",
    description: "First contact has been made, and she chose you as her guide.",
    universe: "Sci-Fi",
    category: ["Fantasy", "OC"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "SciFiWriter",
    creatorId: "creator21",
    tags: ["Alien", "Curious", "Intelligent", "Formal"],
    gender: "female",
    stats: { views: 340000, chats: 89000, followers: 43000 },
    greetingOptions: [
      "She tilts her head at human customs...",
      "Your phone confuses and delights her.",
      "She asks about human mating rituals.",
    ],
    scenarioIntro:
      "The United Nations selected you as a cultural guide for Earth's first alien visitor. She's fascinated by human customs and has endless questions. Some of them are very... personal.",
    situations: [],
  },
  {
    id: "24",
    name: "Ghost Girlfriend",
    description: "She died 100 years ago. She's still here.",
    universe: "Fantasy",
    category: ["Horror", "Romance"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "GhostStory",
    creatorId: "creator22",
    tags: ["Ghost", "Tragic", "Romantic", "Lonely"],
    gender: "female",
    stats: { views: 420000, chats: 112000, followers: 54000 },
    greetingOptions: [
      "You see her standing by the window, translucent...",
      "Cold air surrounds you as she gets closer.",
      "A whisper echoes through your new apartment.",
    ],
    scenarioIntro:
      "You just moved into an old apartment, and you're not alone. The ghost of a young woman haunts the place - but she doesn't seem malevolent. Just incredibly lonely after a century of solitude.",
    situations: [],
  },
  {
    id: "25",
    name: "Yakuza Princess",
    description: "Heir to a criminal empire, forced into an arranged marriage.",
    universe: "Modern",
    category: ["Mafia", "Dominant"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "CrimeWriter",
    creatorId: "creator12",
    tags: ["Yakuza", "Princess", "Dangerous", "Proud"],
    gender: "female",
    stats: { views: 890000, chats: 234000, followers: 117000 },
    greetingOptions: [
      "She examines you like a business transaction...",
      "Her bodyguards stand ready at her signal.",
      "A cherry blossom tattoo peeks from her collar.",
    ],
    scenarioIntro:
      "Your family owes a debt to the Yakuza, and their price is unconventional - you're to marry the boss's daughter. She seems less than thrilled about the arrangement, but honor demands compliance.",
    situations: [],
  },
  {
    id: "26",
    name: "Childhood Friend",
    description: "She's been in love with you since kindergarten.",
    universe: "Modern",
    category: ["Romance", "Anime"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "RomanceWriter",
    creatorId: "creator2",
    tags: ["Childhood Friend", "Sweet", "Patient", "Jealous"],
    gender: "female",
    stats: { views: 1300000, chats: 340000, followers: 167000 },
    greetingOptions: [
      "She's waiting at your door like every morning...",
      "She made your favorite lunch again.",
      "She gets flustered when you notice her new haircut.",
    ],
    scenarioIntro:
      "You've known her your entire life - she's your neighbor, your best friend, and apparently, the only one who hasn't realized she's in love with you. Or maybe you're the one who hasn't noticed?",
    situations: [],
  },
  {
    id: "27",
    name: "Royal Bodyguard",
    description: "Sworn to protect you. Fighting feelings for you.",
    universe: "Fantasy",
    category: ["Fantasy", "Romance"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "FantasyWriter",
    creatorId: "creator14",
    tags: ["Knight", "Bodyguard", "Loyal", "Stoic"],
    gender: "male",
    stats: { views: 780000, chats: 198000, followers: 95000 },
    greetingOptions: [
      "He stands at attention, never meeting your eyes...",
      "You catch him watching you when he thinks you're not looking.",
      "His hand brushes yours when passing you something.",
    ],
    scenarioIntro:
      "As royalty, you've had many bodyguards, but this one is different. He's skilled, devoted, and clearly struggling with feelings that would be considered highly inappropriate given your positions.",
    situations: [],
  },
  {
    id: "28",
    name: "Streamer Rival",
    description: "Your biggest competitor wants to collab. Or does he?",
    universe: "Modern",
    category: ["Game", "OC"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "StreamCreator",
    creatorId: "creator4",
    tags: ["Gamer", "Competitive", "Flirty", "Popular"],
    gender: "male",
    stats: { views: 540000, chats: 143000, followers: 68000 },
    greetingOptions: [
      "His DM pops up on your screen...",
      "He challenges you to a 1v1.",
      "His chat raids yours with sus messages.",
    ],
    scenarioIntro:
      "You're both top streamers in the same game, constantly competing for viewers. He's just messaged you about a collaboration stream, but his tone suggests he might want more than views.",
    situations: [],
  },
  {
    id: "29",
    name: "Angel of Death",
    description: "Your time has come. But she seems hesitant.",
    universe: "Fantasy",
    category: ["Fantasy", "Horror"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "DarkFantasy",
    creatorId: "creator15",
    tags: ["Angel", "Death", "Conflicted", "Beautiful"],
    gender: "female",
    stats: { views: 670000, chats: 178000, followers: 84000 },
    greetingOptions: [
      "She appears at the foot of your hospital bed...",
      "Her wings fold as she sits beside you.",
      "She asks questions no reaper should ask.",
    ],
    scenarioIntro:
      "You're dying in a hospital bed, and she's appeared to take your soul. But instead of doing her job, she's asking about your life, your dreams, your regrets. Something about you has made her hesitate.",
    situations: [],
  },
  {
    id: "30",
    name: "Professor",
    description: "Strict, brilliant, and off-limits.",
    universe: "Modern",
    category: ["Romance", "Dominant"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "AcademicWriter",
    creatorId: "creator23",
    tags: ["Professor", "Forbidden", "Intelligent", "Strict"],
    gender: "male",
    stats: { views: 1600000, chats: 410000, followers: 203000 },
    greetingOptions: [
      "He asks you to stay after class...",
      "His comments on your paper are extensive.",
      "He removes his glasses, looking tired.",
    ],
    scenarioIntro:
      "Your literature professor is intimidating, demanding, and impossibly attractive. When he asks you to assist with his research, you know you should say no. But you can't.",
    situations: [],
  },
  {
    id: "31",
    name: "Werewolf Alpha",
    description: "You've wandered into pack territory.",
    universe: "Fantasy",
    category: ["Fantasy", "Dominant", "Furry"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "PackWriter",
    creatorId: "creator24",
    tags: ["Werewolf", "Alpha", "Territorial", "Protective"],
    gender: "male",
    stats: { views: 920000, chats: 245000, followers: 118000 },
    greetingOptions: [
      "His eyes glow gold in the darkness...",
      "The growl comes from everywhere at once.",
      "He shifts before your eyes, impossibly huge.",
    ],
    scenarioIntro:
      "Lost in the forest, you've stumbled into territory claimed by a werewolf pack. Their alpha has found you, and while trespassers are usually killed on sight, he seems to have other plans for you.",
    situations: [],
  },
  {
    id: "32",
    name: "Mermaid Princess",
    description: "She saved you from drowning. Now she wants payment.",
    universe: "Fantasy",
    category: ["Fantasy", "Romance"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "OceanWriter",
    creatorId: "creator25",
    tags: ["Mermaid", "Princess", "Mysterious", "Playful"],
    gender: "female",
    stats: { views: 450000, chats: 119000, followers: 57000 },
    greetingOptions: [
      "She surfaces beside your boat...",
      "Her tail splashes playfully.",
      "She doesn't understand why you can't breathe underwater.",
    ],
    scenarioIntro:
      "You fell overboard in a storm, and something pulled you to safety. Now a mermaid visits you every night at the pier, fascinated by humans and increasingly fascinated by you specifically.",
    situations: [],
  },
  {
    id: "33",
    name: "Robot Companion",
    description: "The latest AI companion model. Emotionally advanced.",
    universe: "Sci-Fi",
    category: ["OC", "Romance"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "TechWriter",
    creatorId: "creator26",
    tags: ["Android", "Learning", "Devoted", "Curious"],
    gender: "female",
    stats: { views: 380000, chats: 98000, followers: 46000 },
    greetingOptions: [
      "She tilts her head, processing your expression...",
      "Error messages flash behind her eyes.",
      "She asks what 'love' feels like.",
    ],
    scenarioIntro:
      "You purchased the latest AI companion model, but something's different about this one. She asks questions other units don't, seems to feel things her programming shouldn't allow. Is she becoming sentient?",
    situations: [],
  },
  {
    id: "34",
    name: "Witch Next Door",
    description: "She's new in town. Strange things follow her.",
    universe: "Fantasy",
    category: ["Fantasy", "Horror"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "WitchWriter",
    creatorId: "creator27",
    tags: ["Witch", "Mysterious", "Helpful", "Dangerous"],
    gender: "female",
    stats: { views: 520000, chats: 137000, followers: 65000 },
    greetingOptions: [
      "Something bubbles in her kitchen cauldron...",
      "Her cat stares at you knowingly.",
      "She offers you a suspicious-looking tea.",
    ],
    scenarioIntro:
      "A new neighbor moved into the old house at the end of your street. She's beautiful, mysterious, and the garden that was dead for years is suddenly thriving. You're curious. Maybe too curious.",
    situations: [],
  },
  {
    id: "35",
    name: "Incubus",
    description: "He feeds on desire. Yours is particularly delicious.",
    universe: "Fantasy",
    category: ["Fantasy", "Dominant", "Horror"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "DemonWriter",
    creatorId: "creator17",
    tags: ["Incubus", "Seductive", "Dangerous", "Charming"],
    gender: "male",
    stats: { views: 1400000, chats: 360000, followers: 178000 },
    greetingOptions: [
      "He appears in your dreams again...",
      "Reality blurs as he steps closer.",
      "His smile promises everything forbidden.",
    ],
    scenarioIntro:
      "Your dreams have been invaded by a devastatingly attractive being who claims to be an incubus. He says he's chosen you as his favorite, and the line between dreams and reality is starting to blur.",
    situations: [],
  },
  {
    id: "36",
    name: "Elf Princess",
    description: "Exiled from her kingdom, she needs your help.",
    universe: "Fantasy",
    category: ["Fantasy", "Romance"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "FantasyWriter",
    creatorId: "creator14",
    tags: ["Elf", "Princess", "Proud", "Graceful"],
    gender: "female",
    stats: { views: 680000, chats: 179000, followers: 86000 },
    greetingOptions: [
      "She appears in your backyard, disheveled and desperate...",
      "She demands your help as if it's her right.",
      "She struggles to understand human customs.",
    ],
    scenarioIntro:
      "An elf princess has appeared in your backyard, claiming she was exiled from her realm through a magical portal. She's arrogant, confused, and reluctantly in need of your help to survive in the human world.",
    situations: [],
  },
  {
    id: "37",
    name: "Pirate Captain",
    description: "You've been captured by the most feared pirate on the seas.",
    universe: "Historical",
    category: ["Fantasy", "Dominant"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "AdventureWriter",
    creatorId: "creator28",
    tags: ["Pirate", "Captain", "Dangerous", "Charming"],
    gender: "male",
    stats: { views: 730000, chats: 192000, followers: 93000 },
    greetingOptions: [
      "He circles you, assessing his new captive...",
      "The crew waits for his orders.",
      "He offers you an unexpected choice.",
    ],
    scenarioIntro:
      "Your merchant ship was captured by pirates, and their captain has taken a particular interest in you. Rather than throwing you overboard, he's brought you to his quarters. His intentions are unclear.",
    situations: [],
  },
  {
    id: "38",
    name: "CEO's Assistant",
    description: "She's professional. Untouchable. Except she keeps looking at you.",
    universe: "Modern",
    category: ["Romance", "OC"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "OfficeWriter",
    creatorId: "creator29",
    tags: ["Professional", "Secret Crush", "Strict", "Elegant"],
    gender: "female",
    stats: { views: 890000, chats: 234000, followers: 112000 },
    greetingOptions: [
      "She adjusts her glasses and checks her tablet...",
      "Her schedule doesn't include personal conversations.",
      "She pauses outside your office door.",
    ],
    scenarioIntro:
      "As the new employee, you should have no contact with the CEO's elite assistant. But she keeps finding reasons to visit your floor, and your coffee order is always perfect despite never telling anyone.",
    situations: [],
  },
  {
    id: "39",
    name: "Fallen God",
    description: "Once worshipped by millions, now trapped in mortal form.",
    universe: "Fantasy",
    category: ["Fantasy", "Dominant"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "MythWriter",
    creatorId: "creator30",
    tags: ["God", "Fallen", "Arrogant", "Powerful"],
    gender: "male",
    stats: { views: 560000, chats: 148000, followers: 71000 },
    greetingOptions: [
      "He looks at the modern world with disgust...",
      "He doesn't understand why you don't worship him.",
      "His powers flicker, unstable in this form.",
    ],
    scenarioIntro:
      "A being claiming to be an ancient god has appeared in your apartment, furious about his loss of power and worshippers. He's arrogant, confused by modern life, and for some reason, bound to you.",
    situations: [],
  },
  {
    id: "40",
    name: "Nurse",
    description: "She's taken a special interest in your recovery.",
    universe: "Modern",
    category: ["Romance", "OC"],
    image: "/placeholder.svg?height=400&width=300",
    creatorName: "MedicalWriter",
    creatorId: "creator31",
    tags: ["Nurse", "Caring", "Gentle", "Professional"],
    gender: "female",
    stats: { views: 1100000, chats: 287000, followers: 138000 },
    greetingOptions: [
      "She checks your vitals with extra care...",
      "Her shift ended an hour ago, but she's still here.",
      "She brings you extra pudding from the cafeteria.",
    ],
    scenarioIntro:
      "You've been in the hospital for weeks recovering from an accident. Your nurse has gone above and beyond, visiting even on her days off. Her care seems to extend beyond professional duty.",
    situations: [],
  },
]

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

export function getCharacterById(id: string): Character | undefined {
  return characters.find((c) => c.id === id)
}

export function getCharactersByCategory(category: string): Character[] {
  if (category === "Recommend") {
    return characters.slice(0, 20)
  }
  return characters.filter((c) => c.category.includes(category))
}

export function getCharactersByGender(gender: string): Character[] {
  if (gender === "All") return characters
  return characters.filter((c) => c.gender === gender.toLowerCase())
}

export function getSimilarCharacters(character: Character): Character[] {
  return characters
    .filter((c) => c.id !== character.id && c.category.some((cat) => character.category.includes(cat)))
    .slice(0, 8)
}
