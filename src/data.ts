import { Chapter } from './types';

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "The Classic Labyrinth",
    slug: "classic-corridor",
    sections: [
      {
        heading: "Imagine a Real Labyrinth",
        text: "Stone walls. Long corridors. Dead ends. One entrance. One exit.\n\nAt first, it is annoying but understandable. You enter, you turn left, you hit a wall, you go back, you try another path. It is slow, yes. But the system has one crucial property:"
      },
      {
        quote: "“You can explain exactly how you got somewhere.”",
        text: "That boring, predictable property is the foundation of maintainable, robust software. Every corridor connects to another visible room. The map is honest, and the stack trace is perfectly readable."
      }
    ],
    codeExample: {
      filename: "WalkableLabyrinth.ts",
      language: "typescript",
      code: `// A clean, predictable walkway. 
// Every connection is explicitly modeled as a physical hallway.
class Corridor {
  constructor(
    public readonly from: string, 
    public readonly to: string
  ) {}
}

class Labyrinth {
  constructor(private corridors: Corridor[]) {}
  
  public navigate(start: string): string[] {
    // You follow corridors step-by-step. 
    // No jumping, no hidden portals.
    return ["Entrance", "Corridor_A", "Room_B"];
  }
}`,
      explanation: "This class uses standard, visible connections. You pass dependencies in through standard corridors (constructors). The path matches your exact steps."
    },
    labyrinthPhase: "classic_corridor",
    interactiveChallenge: {
      instruction: "Walk through the traditional corridors to reach the exit cell 'E'. Observe the real-time stack trace of your physical steps on the navigation log console.",
      successCondition: "Reach the exit (E) using standard grid movement without utilizing any trapdoors.",
      badgeName: "Predictable Navigator"
    }
  },
  {
    id: 2,
    title: "The First Shortcut",
    slug: "first-shortcut",
    sections: [
      {
        heading: "A Hole in the Floor",
        text: "Now someone adds a hole in the floor. Step into it, and you instantly appear in another part of the labyrinth.\n\nAt first, this is incredibly useful. Instead of walking through five long corridors, you jump straight from Entrance A to Room B."
      },
      {
        quote: "“This is much easier.”",
        text: "And they are right. For this one specific case. The shortcut solves a real problem. The normal path was long. The hole is fast. Nobody is harmed. Yet."
      }
    ],
    codeExample: {
      filename: "DatabaseSingleton.ts",
      language: "typescript",
      code: `// The first trapdoor appears: Easy global reachability!
class Database {
  private static _instance: Database | null = null;
  private constructor() {} // Hidden constructor

  public static instance(): Database {
    if (!this._instance) {
      this._instance = new Database();
    }
    return this._instance;
  }

  public fetchAll(query: string) {
    return [{ id: 1, email: "alice@example.com" }];
  }
}`,
      explanation: "Just grab Database.instance() from anywhere! No passing variables, no constructor arguments. It is incredibly convenient for a first draft."
    },
    labyrinthPhase: "first_shortcut",
    interactiveChallenge: {
      instruction: "Step into the newly bored trapdoor (the glowing green DB portal) to bypass the long corridor. Experience the convenience of global reachability!",
      successCondition: "Step into the green DB trapdoor and trigger the instant transit.",
      badgeName: "Instant Teleporter"
    }
  },
  {
    id: 3,
    title: "The Folklore Trap",
    slug: "folklore-chaos",
    sections: [
      {
        heading: "Labyrinth Becomes Folklore",
        text: "Then another hole appears. Then another. One connects to a ladder. Another to an underground tunnel. Another drops you into a room containing yet another hole."
      },
      {
        text: "The labyrinth still works. Technically. But people no longer understand it by walking through the corridors. They memorize magical tricks:"
      },
      {
        quote: "“Use the green hole, take the tunnel, and ignore the second ladder.”",
        text: "That is not navigation. That is folklore. And folklore is where software maintenance goes to die."
      }
    ],
    codeExample: {
      filename: "MultiSingletons.ts",
      language: "typescript",
      code: `// Underground shortcuts sprout everywhere
class App {
  execute() {
    // Hidden dependencies lie dormant
    const db = Database.instance();
    const user = CurrentUser.instance();
    const tenant = TenantContext.instance();
    const config = AppConfig.instance();
    
    // Who was initialized first? What is the current global state?
    // It's a mystery.
  }
}`,
      explanation: "Your code is riddled with direct calls to secret global registries. The classes look simple on the surface, but underneath lies a chaotic spider web of mutable shortcuts."
    },
    labyrinthPhase: "folklore_chaos",
    interactiveChallenge: {
      instruction: "Try to walk to the exit. Multiple trapdoors have popped up (Database, User, Config). Beware: stepping on one modifies global state, altering how other trapdoors behave!",
      successCondition: "Get confused or navigate the portal network to experience how global state mutability ruins predictability.",
      badgeName: "Folklore Apprentice"
    }
  },
  {
    id: 4,
    title: "The Map Starts Lying",
    slug: "map-lying",
    sections: [
      {
        heading: "Archaeology with Syntax",
        text: "The original corridors still exist. The walls are still there. The rooms are still visible. The official map path still looks valid.\n\nBut the real movement happens underground. Someone looking at the labyrinth from above sees structure. But the real behavior lives in hidden shortcuts. That is where code starts to rot. Not because one shortcut exists, but because the visible structure and the real structure no longer match."
      },
      {
        quote: "“The map says you should be in Room B. But somehow you are in Room Q.”",
        text: "So you investigate. Not the corridors—the holes! Which hole was used? Where did it point? Was the tunnel changed? Did another shortcut use the same room last month? Did someone patch this before leaving the company? Excellent. We invented archaeology with syntax."
      }
    ],
    codeExample: {
      filename: "UserReportService.ts",
      language: "typescript",
      code: `// This class looks simple. It has an empty constructor.
class UserReportService {
  constructor() {} // Inside, it dependencies on hidden holes!

  public activeUsers() {
    return Database.instance().fetchAll(
      "SELECT id, email FROM users WHERE active = 1"
    );
  }
}`,
      explanation: "The class constructor lies! It says 'I need zero dependencies'. But it secretly depends on a DB connection, a connection configuration, and runtime initialization order. The complexity moved underground."
    },
    labyrinthPhase: "map_lying",
    interactiveChallenge: {
      instruction: "Walk toward Room B. Suddenly, a mutable global state alteration teleports you into Room Q instead! Initiate the 'Syntax Archaeology' scanner to find which global state was mutated.",
      successCondition: "Attempt to go to Room B, get redirected to Room Q, and run the Archeology scan.",
      badgeName: "Syntax Archeologist"
    }
  },
  {
    id: 5,
    title: "The Testing Nightmare",
    slug: "testing-fever",
    sections: [
      {
        heading: "State Leaks Between Runs",
        text: "Someone wants to test the labyrinth. 'I want to verify that a person can walk from entrance to exit.' Reasonable. So they test the corridor path. It passes."
      },
      {
        text: "But production still fails because production uses holes. Then someone says:"
      },
      {
        quote: "“We need to reset the holes before each test.”",
        text: "That sentence should hurt. Because now you are not testing only the labyrinth. You are testing the labyrinth, the hidden tunnel network, global setup order, and whatever dirty state leaked from the last test execution. This is where a shortcut becomes a permanent system tax."
      }
    ],
    codeExample: {
      filename: "LabyrinthTest.ts",
      language: "typescript",
      code: `describe("Labyrinth Navigator", () => {
  beforeEach(() => {
    // ❌ THIS SENTENCE SHIELDS THE ROT. 
    // If we forget this, subsequent tests fail randomly!
    Database.instance().resetState(); 
    CurrentUser.instance().clearSession();
    TenantContext.instance().purge();
  });

  it("can navigate safely", () => {
    const isSuccess = navigateLabyrinth();
    expect(isSuccess).toBe(true);
  });
});`,
      explanation: "Tests must manually reset the world between runs. If tests run in parallel, they pollute each other because they touch the same singleton instances."
    },
    labyrinthPhase: "testing_fever",
    interactiveChallenge: {
      instruction: "Run the parallel Test Suite. Watch how leaked state from preceding tests causes subsequent runs to fail. Click 'Reset Singletons' to manually clean up, or refactor to fix it for good!",
      successCondition: "Trigger the Test Suite, observe the random parallel failure, and trigger a raw state cleanup.",
      badgeName: "Test Suite survivor"
    }
  },
  {
    id: 6,
    title: "The Sovereign Signpost",
    slug: "dependency-injection",
    sections: [
      {
        heading: "Refactoring: Let There Be Corridors",
        text: "What if we make our paths clear and explicit? When one shared instance is fine, can it be a signpost instead of a trapdoor? A shared instance can be fine when the object is: immutable after boot, independent from the current request/user, and owned by the application lifecycle (e.g. AppConfig)."
      },
      {
        quote: "“This version tells the truth.”",
        text: "By switching to explicit dependency injection, constructors tell the absolute truth. The corridors are visible, the map is correct, testing is fully parallel and isolated, and anyone can explain how they got somewhere without holding the whole system in their head like an underpaid wizard."
      }
    ],
    codeExample: {
      filename: "CleanLabyrinth.ts",
      language: "typescript",
      code: `// Everything is perfectly visible. No magical trapdoors.
class UserReportService {
  constructor(
    private readonly userRepository: UserRepository // Explicit corridor!
  ) {}

  public activeUsers() {
    return this.userRepository.findActiveUsers();
  }
}

// In tests, we simply pass a clean MockUserRepository!
// No global resets, no test crosstalk, 100% deterministic.`,
      explanation: "Now dependencies are declared transparently in the constructor. Anyone looking at the code immediately understands its structural needs. Code remains local, testable, and robust."
    },
    labyrinthPhase: "dependency_injection",
    interactiveChallenge: {
      instruction: "Navigate the refactored labyrinth. All trapdoors are replaced by transparent pathways (DI corridors) or immutable 'signposts' (like AppConfig) that never mutate. Run the test suite in parallel with 100% success rate!",
      successCondition: "Reach the exit in the refactored layout and watch parallel tests pass instantly.",
      badgeName: "Sovereign Architect"
    }
  }
];
