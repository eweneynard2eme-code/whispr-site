export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
}

// Products for WHISPR monetization
export const PRODUCTS: Product[] = [
  {
    id: "situation-unlock",
    name: "Unlock Private Moment",
    description: "Unlock this exclusive private interaction with your character",
    priceInCents: 499, // €4.99
  },
  {
    id: "continue-conversation",
    name: "Continue Conversation",
    description: "Continue your intimate conversation and see what happens next",
    priceInCents: 499, // €4.99
  },
  {
    id: "coin-pack-small",
    name: "100 Coins",
    description: "Small coin pack for unlocking content",
    priceInCents: 999, // €9.99
  },
  {
    id: "coin-pack-medium",
    name: "500 Coins",
    description: "Medium coin pack with 20% bonus",
    priceInCents: 3999, // €39.99
  },
  {
    id: "coin-pack-large",
    name: "1200 Coins",
    description: "Large coin pack with 40% bonus",
    priceInCents: 7999, // €79.99
  },
]
