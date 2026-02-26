const CUISINE_KEYWORDS: Record<string, string[]> = {
  Thai: [
    "pad thai", "pad see ew", "som tum", "green curry", "red curry", "yellow curry",
    "massaman", "panang", "tom yum", "tom kha", "papaya salad", "larb", "khao man gai",
    "khao soi", "satay", "thai tea", "sticky rice", "mango rice", "basil chicken",
    "pad krapow", "thai iced tea", "spring rolls", "curry puff", "thai",
  ],
  Japanese: [
    "sushi", "ramen", "udon", "soba", "tempura", "tonkatsu", "gyoza", "edamame",
    "miso", "teriyaki", "yakitori", "okonomiyaki", "takoyaki", "onigiri", "donburi",
    "katsu", "nigiri", "sashimi", "maki", "chirashi", "izakaya", "matcha",
    "japanese", "sake",
  ],
  Mexican: [
    "taco", "tacos", "burrito", "burritos", "enchilada", "quesadilla", "tamale",
    "tamales", "churro", "elote", "pozole", "mole", "carnitas", "carne asada",
    "al pastor", "chorizo", "guacamole", "salsa", "torta", "huevos rancheros",
    "chilaquiles", "fajita", "mexican", "taqueria", "taquito",
  ],
  Italian: [
    "pizza", "pasta", "risotto", "lasagna", "ravioli", "gnocchi", "bruschetta",
    "tiramisu", "gelato", "panna cotta", "prosciutto", "margherita", "pepperoni",
    "calzone", "focaccia", "caprese", "carbonara", "bolognese", "pesto",
    "alfredo", "marinara", "italian", "trattoria", "pizzeria",
  ],
  Chinese: [
    "dim sum", "kung pao", "lo mein", "chow mein", "fried rice", "wonton",
    "dumpling", "dumplings", "mapo tofu", "peking duck", "egg roll", "spring roll",
    "hot pot", "hotpot", "bao", "char siu", "congee", "dan dan", "szechuan",
    "sichuan", "cantonese", "chinese", "general tso",
  ],
  Korean: [
    "bibimbap", "bulgogi", "kimchi", "japchae", "tteokbokki", "galbi", "kalbi",
    "banchan", "korean bbq", "kbbq", "soju", "samgyeopsal", "jjigae", "sundubu",
    "mandoo", "mandu", "korean fried chicken", "kfc", "gochujang", "korean",
  ],
  Vietnamese: [
    "pho", "banh mi", "bun", "spring roll", "vermicelli", "bo luc lac",
    "com tam", "goi cuon", "bun bo hue", "che", "ca phe", "vietnamese",
    "vietnamese coffee",
  ],
  Indian: [
    "curry", "tikka masala", "naan", "biryani", "samosa", "tandoori", "paneer",
    "dal", "daal", "chana", "vindaloo", "korma", "pakora", "dosa", "idli",
    "chai", "butter chicken", "palak", "saag", "raita", "chapati", "roti",
    "indian", "masala",
  ],
  American: [
    "burger", "burgers", "hot dog", "hot dogs", "bbq", "barbecue", "fried chicken",
    "mac and cheese", "mac n cheese", "grilled cheese", "club sandwich",
    "blt", "philly cheesesteak", "buffalo wings", "wings", "cornbread",
    "meatloaf", "pot roast", "biscuits and gravy",
  ],
  Mediterranean: [
    "falafel", "hummus", "shawarma", "kebab", "pita", "tahini", "baba ganoush",
    "tabbouleh", "fattoush", "dolma", "gyro", "gyros", "souvlaki",
    "moussaka", "spanakopita", "baklava", "mediterranean",
  ],
  French: [
    "croissant", "baguette", "crepe", "crepes", "quiche", "ratatouille",
    "boeuf bourguignon", "coq au vin", "bouillabaisse", "escargot",
    "creme brulee", "souffle", "macaron", "macarons", "french", "bistro",
    "brasserie",
  ],
  Seafood: [
    "lobster", "crab", "shrimp", "oyster", "oysters", "clam", "clams",
    "scallop", "scallops", "fish and chips", "fish tacos", "calamari",
    "ceviche", "poke", "poke bowl", "seafood",
  ],
  Coffee: [
    "espresso", "latte", "cappuccino", "americano", "cortado", "flat white",
    "cold brew", "pour over", "drip coffee", "mocha", "macchiato",
  ],
  Breakfast: [
    "pancake", "pancakes", "waffle", "waffles", "french toast", "eggs benedict",
    "omelette", "omelet", "bacon", "sausage", "hash browns", "breakfast burrito",
    "acai bowl", "avocado toast", "brunch",
  ],
  Dessert: [
    "ice cream", "cake", "pie", "brownie", "cookie", "cookies", "donut",
    "donuts", "doughnut", "cupcake", "pastry", "pastries", "cheesecake",
    "pudding", "sundae", "milkshake",
  ],
  Sandwich: [
    "sandwich", "sandwiches", "sub", "hoagie", "panini", "wrap",
    "deli", "po boy",
  ],
  Pizza: [
    "pizza", "calzone", "stromboli", "margherita", "pepperoni pizza",
    "neapolitan", "deep dish", "thin crust", "pizzeria",
  ],
};

export function detectCuisine(
  dishNames: string[],
  restaurantName?: string
): string | null {
  const allText = [
    ...dishNames.map((d) => d.toLowerCase()),
    ...(restaurantName ? [restaurantName.toLowerCase()] : []),
  ];

  const scores: Record<string, number> = {};

  for (const text of allText) {
    for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          scores[cuisine] = (scores[cuisine] ?? 0) + 1;
        }
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

export const CUISINE_LIST = Object.keys(CUISINE_KEYWORDS).sort();
