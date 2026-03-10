Pizza Lab — Mobile App Spec Kit (AI-Ready v2)

This specification is designed to allow AI coding agents or developers to fully implement the application.

Tech stack:

React Native (Expo)

Supabase

Figma MCP

Zustand

TanStack Query

Platforms:

iOS

Android

1. Product Overview

Pizza Lab is a restaurant ordering application allowing customers to:

browse pizzas

customize orders

place orders

track order status

manage profile

The UI must match the 21 Figma screens exactly.

2. Architecture

Architecture style:

Mobile App
   │
   │
Supabase Backend
   │
   │
Integration Layer
   │
   │
WinRest POS (future)

Principles:

frontend is stateless

Supabase handles authentication and database

POS integration isolated

mobile never talks directly to POS

3. Mobile App Stack

Framework:

React Native (Expo)

Language:

Typescript

Libraries:

react-navigation
@supabase/supabase-js
@tanstack/react-query
zustand
react-hook-form
zod
nativewind
expo-image
expo-secure-store
4. Folder Structure
src
 ├── components
 ├── screens
 │   ├── auth
 │   ├── home
 │   ├── menu
 │   ├── cart
 │   ├── orders
 │   └── profile
 │
 ├── navigation
 │
 ├── hooks
 │
 ├── store
 │
 ├── services
 │   ├── api
 │   └── integrations
 │
 ├── lib
 │   └── supabase.ts
 │
 ├── types
 │
 └── utils
5. Supabase SQL Schema
users
create table users (
id uuid primary key default uuid_generate_v4(),
email text unique,
name text,
phone text,
created_at timestamp default now()
);
pizzas
create table pizzas (
id uuid primary key default uuid_generate_v4(),
name text,
description text,
price numeric,
image_url text,
category text,
winrest_id text
);
orders
create table orders (
id uuid primary key default uuid_generate_v4(),
user_id uuid references users(id),
status text,
total_price numeric,
pos_id text,
pos_status text,
created_at timestamp default now()
);
order_items
create table order_items (
id uuid primary key default uuid_generate_v4(),
order_id uuid references orders(id),
pizza_id uuid references pizzas(id),
quantity integer,
price numeric
);
6. API Contracts

All requests go through Supabase client.

Fetch Menu
GET /pizzas

Response

[
{
id
name
description
price
image_url
}
]
Create Order
POST /orders

Payload

{
items:[
{
pizza_id
quantity
}
]
}
Fetch Orders
GET /orders?user_id=
7. State Management

Use Zustand.

Stores:

authStore
cartStore
userStore
Cart Store Example
items: CartItem[]

addItem()
removeItem()
updateQuantity()
clearCart()
getTotal()
8. Navigation

Navigation system:

Stack + Bottom Tabs
Auth Stack
Login
Register
Main Tabs
Home
Menu
Cart
Orders
Profile
9. Figma MCP Integration

Design source:

https://www.figma.com/design/Nxyu09xIBg5fVZW7jUdeNb/APP---PIZZA-LAB_Chef-Domingos

Use:

mcp.figmacontext.get_design_context
Required Screens
652-316
652-333
652-350
652-309
652-419
652-367
652-388
652-450
652-528
652-650
652-698
652-554
652-602
652-1046
652-1171
652-1173
652-1172
652-1174
652-1093
652-1176
652-1175
10. Component Library

Reusable components:

Button
Input
Card
PizzaCard
CartItem
QuantitySelector
Header
BottomTabBar
11. Design Tokens

Extract tokens from Figma.

Colors:

primary
secondary
background
text
accent

Spacing scale:

4
8
16
24
32

Typography:

Heading
Subheading
Body
Caption
12. Supabase Client
src/lib/supabase.ts

Example:

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
process.env.EXPO_PUBLIC_SUPABASE_URL!,
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)
13. POS Integration Preparation

Future POS:

WinRest

This is NOT implemented in MVP.

Integration Architecture
Mobile
  ↓
Supabase
  ↓
Edge Functions
  ↓
WinRest POS
POS Interface
POSProvider

Example:

export interface POSProvider {

syncMenu(): Promise<void>

createOrder(order): Promise<any>

getOrderStatus(orderId:string): Promise<string>

}
14. WinRest Adapter (Future)
services/integrations/winrest.adapter.ts
export class WinRestAdapter implements POSProvider {
}
15. Edge Functions

Future functions:

create-pos-order
sync-menu
update-order-status
16. Order Status

Internal statuses:

pending
confirmed
preparing
ready
completed
cancelled
17. Feature Flags

Table:

settings

Example:

winrest_enabled = false
18. Offline Strategy

If POS unavailable:

pos_status = pending

Retry sync.

19. Performance

Best practices:

memoized components

cached queries

lazy screens

optimized images

20. Testing

Tools:

Jest
React Native Testing Library

Test flows:

login

cart

order placement

21. Build & Deployment

Commands:

npx expo prebuild
npx expo run:ios
npx expo run:android

Production:

eas build
22. Definition of Done

The app is complete when:

all 21 screens implemented

runs on iOS and Android

Supabase auth works

orders can be created

cart logic works

UI matches Figma