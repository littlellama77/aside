# Aside

> **A little help staying in the conversation.**  
> *A lightweight real-time conversation companion for meetings and presentations.*

---

## The Core Idea

Someone asks you something.  
Your brain goes blank.  
**Aside quietly gives you enough context to get moving again.**

Aside is a discreet conversation companion for meetings, interviews, presentations, and classes. It does **not** speak for the user or replace the user's voice. Its purpose is to bridge:

$$\text{Knowing} \longrightarrow \text{Retrieving} \longrightarrow \text{Formulating} \longrightarrow \text{Speaking}$$

---

## 1. Core Principles

- **Quiet when not needed:** The assistant stays calm and silent until a question is genuinely directed at the user.
- **Laptop is the "Ears + Brain":** All speech recognition, conversation context tracking, question detection, and response anticipation run on the laptop.
- **Phone is the "Private Display Only":** The paired mobile companion requires **zero microphone access** and never listens to the call; it functions purely as an unobtrusive, glanceable cue card.
- **Zero-regeneration invariant:** When the user begins speaking, Aside enters `YOUR_TURN` and immediately freezes the suggestion. It **never** regenerates answers based on the user's own speech.
- **1–2 second glance design:** Cues are optimized for instant comprehension so the user can look at Aside for one second, absorb what they need to say, look back at the room, and speak naturally.

---

## 2. Conversation State Machine

Aside operates an explicit 6-state machine:

| State | Indicator | Behavior |
| :--- | :--- | :--- |
| **`LISTENING`** | `● listening` | Standby mode. Minimal, quiet UI. |
| **`OTHER_PERSON_SPEAKING`** | `🎙️ Participant speaking` | Tracks rolling conversation context without interrupting. |
| **`POSSIBLE_QUESTION`** | `Evaluating...` | Checks question structure, user role, prior statements, and pauses. |
| **`QUESTION_CONFIRMED`** | `✦ question detected` | Prepares the smallest useful glanceable cue immediately. |
| **`YOUR_TURN`** | `🗣️ YOUR TURN (Frozen)` | Suggestion locks in place. No regeneration loops while answering. |
| **`RESPONSE_FINISHED`** | `● listening` | Returns to quiet standby after a natural conversational pause. |

---

## 3. Laptop → Phone Companion Sync

- **Internet-Accessible Pairing:** Uses WebRTC DataChannels (PeerJS) to connect laptop and phone across any network (e.g. laptop on Wi-Fi and phone on cellular 5G).
- **Local Relay Fallback:** Instantaneous BroadcastChannel and StorageEvent synchronization for same-device demo testing and pop-up windows.
- **Screen-Sharing Safety Mode:** When screen sharing is enabled on the laptop, desktop prompts disappear (`Private mode → Phone`), streaming cues exclusively to the paired mobile screen.
- **Two-Way Recovery:** Tapping **`😭 I'm stuck`** or **`⏱️ Need a second`** on the phone triggers grounding recovery on both surfaces simultaneously.

---

## 4. Key Features

- **Messy Notes Synthesis:** Transforms raw unstructured bullet dumps into an Executive Memory Brief with strategic talking points and verified metrics.
- **Starting Phrases:** Shows conversational openings (*“Start with: ‘Yeah, I think there are two main things...’”*) so you never stare blankly while formulating thoughts.
- **Jargon Translation Mode:** Simplifies complex or convoluted corporate phrasing (*“What are they actually asking?”*).
- **Graceful Unknown Handling:** Refuses to hallucinate facts missing from context; offers dignified safe responses (*“I'm not sure about that off the top of my head — let me check and get back to you.”*).
- **Section 23 Developer / Demo Toolbar:** Interactive test controls for simulating turn-taking, room questions, user speech freezes, and 8 end-to-end conversation scenarios.

---

## 5. Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/littlellama77/aside.git
cd aside
npm install
```

### Development Server
```bash
npm run dev
```

Open `http://localhost:5174/` in your browser.

To open the Phone Companion directly:
```bash
http://localhost:5174/?view=phone&code=ASIDE-8492
```

### Production Build
```bash
npm run build
```

---

## License
MIT
