# MemeWeb Chat & Calling Features

## Overview
The MemeWeb application now includes comprehensive messaging and calling capabilities, allowing users to:

- **Send & Receive Messages**: Real-time messaging between users
- **Audio Calls**: Initiate and receive audio calls
- **Video Calls**: Initiate and receive video calls
- **Conversations**: Manage multiple conversations with different users

## Features

### 1. Chat System

#### Accessing Chat
- Tap the **Chat** tab in the bottom navigation bar
- Browse your existing conversations
- Click on a conversation to view messages

#### Sending Messages
- Type your message in the input field at the bottom
- Press the send button (paper plane icon)
- Messages are instantly delivered and received in real-time

#### Starting New Conversations
From the **Explore** page:
- Browse trending creators
- Click the message icon next to any user
- A new conversation will be created with that user

### 2. Audio & Video Calling

#### Making a Call
1. Open a conversation with the user you want to call
2. Click the **Phone icon** for audio call or **Video icon** for video call
3. The recipient will see an incoming call notification
4. They can accept or decline the call

#### Receiving a Call
- When someone calls you, a modal popup appears with their name and call type
- Choose to **Accept** or **Decline** the call

#### Call Management
- Calls are tracked in the database with their status (pending, accepted, ended, declined)
- Call duration is recorded with started_at and ended_at timestamps

## Database Schema

### Tables Created

#### `conversations`
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations,
  sender_id UUID REFERENCES profiles,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ
);
```

#### `calls`
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY,
  caller_id UUID REFERENCES profiles,
  callee_id UUID REFERENCES profiles,
  call_type TEXT (audio|video),
  status TEXT (pending|accepted|ended|declined),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

## Components

### Chat.tsx
- Main chat interface
- Conversation list management
- Message display and input
- Incoming call handling
- Audio/video call initiation

### MessageUsers.tsx
- User search modal
- Start conversations with new users
- Search by username or display name

### Updated Components
- **App.tsx**: Added 'chat' tab to main app
- **BottomNav.tsx**: Added Chat navigation button
- **Explore.tsx**: Added message buttons to user profiles

## Real-time Features

All features use Supabase's real-time subscriptions for instant updates:
- New messages appear immediately
- Incoming calls trigger notifications
- Conversation list updates in real-time

## Security

Row-Level Security (RLS) policies ensure:
- Users can only view their own conversations
- Users can only send messages to conversations they're part of
- Users can only view calls they're involved in
- All operations are scoped to the authenticated user

## Future Enhancements

To implement full calling functionality, integrate:
- **WebRTC** for peer-to-peer communication
- **Jitsi** or **Twilio** for managed calling services
- Real-time audio/video codec support
- Call recording and replays
- Screen sharing capabilities

## Installation

The database schema is defined in:
```
supabase/migrations/20260214_add_messaging_schema.sql
```

Apply this migration to your Supabase database to enable messaging and calling features.

## Usage Example

```typescript
// Start a conversation
const { data: conversation } = await supabase
  .from('conversations')
  .insert({ participant_ids: [user1Id, user2Id] })
  .select()
  .single();

// Send a message
await supabase.from('messages').insert({
  conversation_id: conversation.id,
  sender_id: user1Id,
  content: 'Hello!'
});

// Start a call
await supabase.from('calls').insert({
  caller_id: user1Id,
  callee_id: user2Id,
  call_type: 'video'
});
```
