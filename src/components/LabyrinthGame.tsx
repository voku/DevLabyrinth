import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Zap, 
  Terminal, 
  Layers,
  RefreshCw, 
  CheckCircle, 
  XSquare, 
  Search, 
  HelpCircle,
  FileCode,
  ShieldCheck,
  Server,
  Play
} from 'lucide-react';
import { Position, GridTile, Trapdoor, GameLog, LabyrinthPhase, TestResult } from '../types';

interface LabyrinthGameProps {
  phase: LabyrinthPhase;
  onActionComplete: (badgeUnlocked: string) => void;
}

// 6x6 Grid Configuration
const GRID_SIZE = 6;
const HAS_ELEMENT_SCROLL_TO = typeof Element !== 'undefined' && 'scrollTo' in Element.prototype;

// Trapdoors configuration
const TRAPDOORS_CONFIG: Record<string, Trapdoor> = {
  db_hole: {
    id: 'db_hole',
    name: 'Database::instance()',
    source: { x: 1, y: 1 },
    target: { x: 4, y: 4 },
    color: '#10b981', // emerald
    description: 'Bypasses 5 central rooms. Fetches global user query instantly.',
    codeSnippet: 'Database::instance()->fetchAll("SELECT id, email FROM users")',
  },
  user_hole: {
    id: 'user_hole',
    name: 'CurrentUser::instance()',
    source: { x: 3, y: 0 },
    target: { x: 1, y: 4 },
    color: '#ef4444', // red
    description: 'Injects ambient logged-in user contextual records everywhere.',
    codeSnippet: 'CurrentUser::instance()->id()',
    stateKey: 'cached_user_id'
  },
  tenant_hole: {
    id: 'tenant_hole',
    name: 'TenantContext::instance()',
    source: { x: 4, y: 1 },
    target: { x: 1, y: 3 },
    color: '#8b5cf6', // purple
    description: 'Smuggles target tenant billing codes deep under business lines.',
    codeSnippet: 'TenantContext::instance()->tenantId()',
    stateKey: 'active_tenant_id'
  },
  config_hole: {
    id: 'config_hole',
    name: 'AppConfig::instance()',
    source: { x: 1, y: 5 },
    target: { x: 4, y: 5 },
    color: '#3b82f6', // blue
    description: 'Process-wide static configuration access.',
    codeSnippet: 'AppConfig::instance()->get("env")',
    isSafe: true
  }
};

export default function LabyrinthGame({ phase, onActionComplete }: LabyrinthGameProps) {
  // --- STATE ---
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 0, y: 0 });
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [visitedCount, setVisitedCount] = useState<number>(0);
  const [stepSequence, setStepSequence] = useState<string[]>(['Entrance (0,0)']);
  const [difficulty, setDifficulty] = useState<'blog' | 'shop' | 'erp'>('blog');
  
  // Folklore Phase Stateful Mutated Variables (Underground paths)
  const [globalTenantState, setGlobalTenantState] = useState<string>('NULL');
  const [globalUserState, setGlobalUserState] = useState<string>('NULL');
  const [hasMutatedState, setHasMutatedState] = useState<boolean>(false);

  // Map Lying State
  const [isArcheologyScanning, setIsArcheologyScanning] = useState<boolean>(false);
  const [archeologyReport, setArcheologyReport] = useState<string | null>(null);
  const [redirectedToQ, setRedirectedToQ] = useState<boolean>(false);

  // Testing Phase State
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isTestingRunning, setIsTestingRunning] = useState<boolean>(false);
  const [isTestResetInjected, setIsTestResetInjected] = useState<boolean>(false);
  const [activeCombIndex, setActiveCombIndex] = useState<number>(0);
  const [testRunnerStep, setTestRunnerStep] = useState<number>(-1);
  const [activeRunTestIdx, setActiveRunTestIdx] = useState<number>(-1);
  const [pendingTrapdoorJump, setPendingTrapdoorJump] = useState<{ trapdoorId: string; position: Position } | null>(null);

  // Animates combinatorial test runner tracing
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCombIndex(prev => {
        const limit = difficulty === 'blog' ? 4 : difficulty === 'shop' ? 18 : 96;
        return (prev + 1) % limit;
      });
    }, 240);
    return () => clearInterval(interval);
  }, [difficulty]);

  // Grid definition generator based on active phases and system difficulty/scale
  const getGridMap = (): GridTile[][] => {
    const map: GridTile[][] = [];
    
    // Dynamic difficulty layouts:
    // Blog (Easy): Simple pathways, minimal dependencies
    // Shop (Medium): Moderate walls representing cart, checkout, payment pipelines
    // ERP (Hard): Complex multi-ledger, dynamic billing locks and nested enterprise boundaries
    const WALLS_BY_DIFFICULTY: Record<'blog' | 'shop' | 'erp', Record<string, boolean>> = {
      blog: {
        '0,3': true,
        '2,1': true, '2,2': true,
        '4,2': true,
      },
      shop: {
        '0,1': true, '0,3': true,
        '2,1': true, '2,2': true, '2,3': true,
        '3,5': true,
        '4,2': true, '5,1': true,
      },
      erp: {
        '0,1': true, '0,3': true,
        '2,1': true, '2,2': true, '2,3': true,
        '3,3': true, '3,5': true,
        '4,2': true, '5,1': true,
      }
    };

    const walls: Record<string, boolean> = { ...WALLS_BY_DIFFICULTY[difficulty] };

    // Refactored phase uses fewer strict walls and has clear corridors
    if (phase === 'dependency_injection') {
      delete walls['2,2'];
      delete walls['3,3'];
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      const row: GridTile[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        let type: GridTile['type'] = 'empty';
        let label = '';
        let subtitle = '';
        let trapdoorId: string | undefined;

        if (x === 0 && y === 0) {
          type = 'entrance';
          label = 'ENT';
          subtitle = 'Start';
        } else if (x === 5 && y === 5) {
          type = 'exit';
          label = 'EXIT';
          subtitle = 'Production';
        } else if (walls[`${x},${y}`]) {
          type = 'wall';
        } else {
          // Dynamic features based on the phase
          if (phase === 'first_shortcut' && x === 1 && y === 1) {
            type = 'trapdoor';
            label = 'DB';
            subtitle = 'Shortcut';
            trapdoorId = 'db_hole';
          } else if (
            (phase === 'folklore_chaos' || phase === 'map_lying' || phase === 'testing_fever')
          ) {
            if (x === 1 && y === 1) {
              type = 'trapdoor';
              label = 'DB';
              subtitle = 'Singleton';
              trapdoorId = 'db_hole';
            } else if (x === 3 && y === 0) {
              type = 'trapdoor';
              label = 'USER';
              subtitle = 'Singleton';
              trapdoorId = 'user_hole';
            } else if (x === 4 && y === 1) {
              type = 'trapdoor';
              label = 'TEN';
              subtitle = 'Singleton';
              trapdoorId = 'tenant_hole';
            }
          } else if (phase === 'dependency_injection') {
            if (x === 1 && y === 1) {
              type = 'signpost';
              label = 'DI';
              subtitle = 'Explicit';
            } else if (x === 3 && y === 0) {
              type = 'signpost';
              label = 'MOCK';
              subtitle = 'Explicit';
            } else if (x === 4 && y === 5) {
              type = 'signpost';
              label = 'CONFIG';
              subtitle = 'AppConfig';
              trapdoorId = 'config_hole';
            }
          }
        }

        // Room Q designation mapping (Archaeology phase)
        if (x === 0 && y === 4 && type === 'empty') {
          label = 'RM_Q';
          subtitle = 'Vulnerable';
        }

        if (x === 3 && y === 4 && type === 'empty') {
          label = 'RM_B';
          subtitle = 'Target';
        }

        row.push({ x, y, type, label, subtitle, trapdoorId });
      }
      map.push(row);
    }
    return map;
  };

  const gridMap = useMemo(() => getGridMap(), [difficulty, phase]);
  const consoleScrollRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledConsoleRef = useRef(false);
  // --- LOGGING UTILITY ---
  const addLog = (type: GameLog['type'], message: string, details?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: GameLog = {
      id: Math.random().toString(36).substring(3),
      timestamp,
      type,
      message,
      details
    };
    setLogs(prev => [...prev.slice(-40), newLog]); // Keep last 40 logs
  };

  // Scroll console to bottom on changes
  useEffect(() => {
    if (consoleScrollRef.current) {
      const targetTop = Math.max(
        consoleScrollRef.current.scrollHeight - consoleScrollRef.current.clientHeight,
        0
      );

      if (HAS_ELEMENT_SCROLL_TO) {
        consoleScrollRef.current.scrollTo({
          top: targetTop,
          behavior: hasAutoScrolledConsoleRef.current ? 'smooth' : 'auto'
        });
      } else {
        consoleScrollRef.current.scrollTop = targetTop;
      }

      hasAutoScrolledConsoleRef.current = true;
    }
  }, [logs]);

  // Handle phase transitions / initializes
  useEffect(() => {
    // Reset player position when phase changes
    setPlayerPosition({ x: 0, y: 0 });
    setStepSequence(['Entrance (0,0)']);
    setVisitedCount(0);
    setGlobalTenantState('NULL');
    setGlobalUserState('NULL');
    setHasMutatedState(false);
    setRedirectedToQ(false);
    setArcheologyReport(null);
    setIsArcheologyScanning(false);
    setTests([]);
    setIsTestingRunning(false);
    setIsTestResetInjected(false);
    setActiveCombIndex(0);
    setTestRunnerStep(-1);
    setActiveRunTestIdx(-1);
    setPendingTrapdoorJump(null);
    
    // Initial informational logs
    setLogs([]);
    addLog('system', `Labyrinth phase shifted to: ${phase.toUpperCase().replace('_', ' ')}`);
    
    if (phase === 'classic_corridor') {
      addLog('info', 'Clean environment instantiated. Navigate using corridors (Arrow keys or clicking buttons/cells). No hidden ports.');
    } else if (phase === 'first_shortcut') {
      addLog('info', 'A green Database trapdoor has appeared at cell (1, 1). Step onto it once and it yanks you straight through five corridors.');
    } else if (phase === 'folklore_chaos') {
      addLog('warning', 'Multiple singletons detected. Mutable global variables are active. Activating a portal changes global runtime variables.');
      addLog('info', 'CurrentUser::instance() is live at (3,0). tenantId() is live at (4,1).');
    } else if (phase === 'map_lying') {
      addLog('warning', 'A severe production bug has been reported: players trying to reach room B (3,4) get mysteriously thrown into Room Q (0,4) instead!');
      addLog('info', 'Try navigating toward Room B to trigger and diagnose the error using archaeology tools.');
    } else if (phase === 'testing_fever') {
      addLog('warning', 'Our test suite is failing due to global state leakages. Simulate running the parallel testing framework.');
      // Pre-populate tests
      setTests([
        { name: 'test_user_report_service()', status: 'pending' },
        { name: 'test_tenant_domain_filter()', status: 'pending' },
        { name: 'test_database_fetch_active_users()', status: 'pending' },
        { name: 'test_invoice_creation_time()', status: 'pending' }
      ]);
    } else if (phase === 'dependency_injection') {
      addLog('success', 'Refactored clean corridors active! Dependency Injection binds explicit instances. AppConfig is static and safe.');
    }
  }, [phase]);

  const activateTrapdoor = (trapdoorId: string, originPosition?: Position) => {
    const config = TRAPDOORS_CONFIG[trapdoorId];
    if (!config) {
      addLog('error', `Trapdoor activation failed: no configuration found for "${trapdoorId}".`);
      return null;
    }

    let finalX = config.target.x;
    let finalY = config.target.y;
    const sourcePosition = originPosition ?? playerPosition;

    if (phase === 'first_shortcut') {
      addLog('success', `⚡ Trapdoor triggered: ${config.name}! Bypassed 5 long corridors!`, `Telemetry: Teleported from (${sourcePosition.x}, ${sourcePosition.y}) to (${finalX}, ${finalY})`);
      onActionComplete('Instant Teleporter');
    } else if (phase === 'folklore_chaos') {
      if (config.id === 'user_hole') {
        setGlobalUserState('User_Session_Id_8923');
        setHasMutatedState(true);
        addLog('warning', `⚡ Global state mutated: CurrentUser::instance() cached ID to 'User_Session_Id_8923'`, 'All subsequent queries now run with this user context!');
      } else if (config.id === 'tenant_hole') {
        setGlobalTenantState('Tenant_Code_Alpha');
        setHasMutatedState(true);
        addLog('warning', `⚡ Global state mutated: TenantContext::instance() stored tenant = 'Tenant_Code_Alpha'`, 'This changed the ambient tenant filter.');
      } else if (config.id === 'db_hole') {
        if (globalTenantState === 'Tenant_Code_Alpha') {
          finalX = 0;
          finalY = 4;
          addLog('error', '⚡ Trapdoor Error: Database resolve path altered by stale TenantContext state: Redirected to Room Q!', 'This is folklore in action.');
        } else {
          addLog('success', `⚡ Database shortcut jumped normally to (${finalX}, ${finalY}) because TenantContext state is clean.`);
        }
      }
      onActionComplete('Folklore Apprentice');
    }

    if (finalX < 0 || finalX >= GRID_SIZE || finalY < 0 || finalY >= GRID_SIZE) {
      addLog('error', `Trapdoor activation failed: destination (${finalX}, ${finalY}) is outside the labyrinth bounds.`);
      return null;
    }

    setPlayerPosition({ x: finalX, y: finalY });
    const cellName = gridMap[finalY][finalX].label || `Room (${finalX}, ${finalY})`;
    setStepSequence(prev => [...prev, `${cellName} (${finalX}, ${finalY})`]);
    setVisitedCount(prev => prev + 1);

    if (finalX === 5 && finalY === 5) {
      addLog('success', '🏆 Reached exit, but you relied on shortcut trapdoors.');
    }

    return { x: finalX, y: finalY };
  };

  const handleTrapdoorContact = (trapdoorId: string, trapdoorPosition: Position) => {
    const config = TRAPDOORS_CONFIG[trapdoorId];
    if (config) {
      addLog('warning', `Trapdoor discovered: ${config.name}. Contact auto-triggered the hidden shortcut immediately.`, config.description);
    }

    setPlayerPosition(trapdoorPosition);
    const trapdoorName = gridMap[trapdoorPosition.y][trapdoorPosition.x].label || `Room (${trapdoorPosition.x}, ${trapdoorPosition.y})`;
    setStepSequence(prev => [...prev, `${trapdoorName} (${trapdoorPosition.x}, ${trapdoorPosition.y})`]);
    setVisitedCount(prev => prev + 1);
    setPendingTrapdoorJump({ trapdoorId, position: trapdoorPosition });
  };

  // --- CORE MOVEMENT RESOLVER ---
  const moveCharacter = (dx: number, dy: number, overrideStart?: Position) => {
    // If testing suite is currently sweeping grid, block keyboard actions
    if (isTestingRunning && !overrideStart) {
      return null;
    }

    if (phase === 'testing_fever' && !isTestResetInjected) {
      addLog('error', 'Labyrinth is locked down by QA until testing block is resolved.');
      return null;
    }

    const startX = overrideStart ? overrideStart.x : playerPosition.x;
    const startY = overrideStart ? overrideStart.y : playerPosition.y;

    const nextX = startX + dx;
    const nextY = startY + dy;

    // Check boundaries
    if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
      addLog('warning', 'Boundary error: Walked into structural perimeter.');
      return null;
    }

    // Check wall collision
    const targetCell = gridMap[nextY][nextX];
    if (targetCell.type === 'wall') {
      addLog('warning', `Collision at (${nextX}, ${nextY}): Stone wall blocks movement. No explicit corridor exists here.`);
      return null;
    }

    // Resolve Movement
    let finalX = nextX;
    let finalY = nextY;

    if (targetCell.type === 'trapdoor' && targetCell.trapdoorId) {
      const trapdoorPosition = { x: nextX, y: nextY };
      handleTrapdoorContact(targetCell.trapdoorId, trapdoorPosition);
      return trapdoorPosition;
    }

    // Phase 4 Map Lying specific bug: Attempting to walk to Room B (3,4) 
    if (phase === 'map_lying' && nextX === 3 && nextY === 4) {
      // Secretly redirect to Room Q (0, 4)
      finalX = 0;
      finalY = 4;
      setRedirectedToQ(true);
      addLog('error', '⚠️ CRITICAL PRODUCTION INCIDENT: Arrived in Room Q (0,4) instead of Room B (3,4)!');
      addLog('archeology', 'The map lied completely because the real movement happens underground. RUN THE SYNTAX ARCHEOLOGY SCANNER below to debug!');
    }

    // Phase 5 Dependency Injection Safe Signpost behaviour
    if (phase === 'dependency_injection' && targetCell.type === 'signpost' && targetCell.trapdoorId === 'config_hole') {
      addLog('success', `📜 Inspected AppConfig signpost: IMMUTABLE environment variables. Safe for concurrent operations.`);
    }

    // Update coordinates & traces
    setPlayerPosition({ x: finalX, y: finalY });
    const cellName = gridMap[finalY][finalX].label || `Room (${finalX}, ${finalY})`;
    setStepSequence(prev => [...prev, `${cellName} (${finalX}, ${finalY})`]);
    setVisitedCount(prev => prev + 1);

    // Standard Corridor completion trace
    if (finalX === 5 && finalY === 5) {
      if (phase === 'classic_corridor') {
        addLog('success', '🏆 Reached exit safely! Navigated entirely using explicit visible corridors.', `Trace Sequence: ${stepSequence.join(' → ')}`);
        onActionComplete('Predictable Navigator');
      } else if (phase === 'dependency_injection') {
        addLog('success', '🏆 Reached production exit safely! Fully documented structure.', '0 global variables were polluted.');
        onActionComplete('Sovereign Architect');
      } else {
        addLog('success', '🏆 Reached exit, but you relied on shortcut trapdoors.');
      }
    }

    return { x: finalX, y: finalY };
  };

  // --- KEYBOARD LISTENER ---
  useEffect(() => {
    if (!pendingTrapdoorJump) {
      return;
    }

    activateTrapdoor(pendingTrapdoorJump.trapdoorId, pendingTrapdoorJump.position);
    setPendingTrapdoorJump(null);
  }, [pendingTrapdoorJump, activateTrapdoor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is writing in inputs (not applicable here, but good practice)
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (isTestingRunning || pendingTrapdoorJump) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          moveCharacter(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          moveCharacter(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          moveCharacter(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          moveCharacter(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, phase, globalTenantState, isTestResetInjected, isTestingRunning, pendingTrapdoorJump]);

  // --- DIAGNOSTIC SCANNERS ---
  const runArcheologyScan = () => {
    if (!redirectedToQ) {
      addLog('info', 'Archeology scan active, but you must trigger the bug first by walking into Room B (3, 4).');
      return;
    }
    setIsArcheologyScanning(true);
    addLog('archeology', 'Analyzing active syntax heap... Reading global scope registries...');
    
    setTimeout(() => {
      const report = `
[ARCHEOLOGY REPORT: SYNTAX UNDERGROUND ANALYSIS]
-----------------------------------------------------------
1. CRASH POINT: Arrived in Room Q (0, 4)
2. STRUCTURAL EXPECTATION: Room B (3, 4)
3. AST ANALYSIS DETECTED:
   - TenantContext::instance()->storedTenantId is set to "Tenant_Alpha"
   - Triggered inside Database connection resolver at hook point.
   - Root database query resolved database shard "DB_SHARD_Q" based on Tenant ID.
   
4. HOW THIS OCCURRED:
   - UserReportService lacks a constructor argument.
   - It secretly accessed Database::instance() inside activeUsers().
   - The Database Singleton accessed the global TenantContext Singleton.
   - A previous unrelated request set TenantContext to "Tenant_Alpha" and never cleared it.
   
5. THE MAP LIED:
   - The visible UserReportService class file claims to have ZERO dependencies.
   - The architecture file says routing is normal.
   - The state lived underground.
   `;
      setArcheologyReport(report);
      setIsArcheologyScanning(false);
      addLog('success', 'Archeology scan finished! Stale mutable state identified inside the Singleton trapdoors.');
      onActionComplete('Syntax Archeologist');
    }, 1200);
  };

  // --- GRID COVERAGE PATH GENERATOR (SERPENTINE SWEEP) ---
  const getGridCoveragePath = (): Position[] => {
    const walls: Record<string, boolean> = {
      blog: { '0,3': true, '2,1': true, '2,2': true, '4,2': true },
      shop: { '0,1': true, '0,3': true, '2,1': true, '2,2': true, '2,3': true, '3,5': true, '4,2': true, '5,1': true },
      erp: { '0,1': true, '0,3': true, '2,1': true, '2,2': true, '2,3': true, '3,3': true, '3,5': true, '4,2': true, '5,1': true }
    }[difficulty];

    const currentWalls = { ...walls };
    if (phase === 'dependency_injection') {
      delete currentWalls['2,2'];
      delete currentWalls['3,3'];
    }

    const GRID_SIZE = 6;
    const isWall = (x: number, y: number) => {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return true;
      return !!currentWalls[`${x},${y}`];
    };

    const path: Position[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const isEvenRow = y % 2 === 0;
      if (isEvenRow) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (!isWall(x, y)) path.push({ x, y });
        }
      } else {
        for (let x = GRID_SIZE - 1; x >= 0; x--) {
          if (!isWall(x, y)) path.push({ x, y });
        }
      }
    }
    return path;
  };

  // --- DYNAMIC TEST SUITE RUNNER WITH SERPENTINE SWEEP ANIMATION ---
  const runTestSuite = () => {
    if (isTestingRunning) return;
    setIsTestingRunning(true);
    setTestRunnerStep(0);
    setActiveRunTestIdx(0);
    
    const coveragePath = getGridCoveragePath();
    const totalSteps = coveragePath.length;
    const totalPermutations = difficulty === 'blog' ? 4 : difficulty === 'shop' ? 18 : 96;

    addLog('system', `⚡ INITIATING GRID COVERAGE TEST RUNNER: Sweeping ${totalSteps} unblocked modules...`);
    addLog('info', `Simulating state permutation check vector of ${totalPermutations} combinations across continuous path.`);

    setTests([
      { name: 'test_user_report_service()', status: 'running' },
      { name: 'test_tenant_domain_filter()', status: 'pending' },
      { name: 'test_database_fetch_active_users()', status: 'pending' },
      { name: 'test_invoice_creation_time()', status: 'pending' }
    ]);

    let step = 0;
    const isDI = phase === 'dependency_injection';

    const intervalRef = setInterval(() => {
      step++;
      if (step >= totalSteps) {
        clearInterval(intervalRef);
        setIsTestingRunning(false);
        setTestRunnerStep(-1);
        setActiveRunTestIdx(-1);

        // Finalize suite
        if (isDI || isTestResetInjected) {
          setTests([
            { name: 'test_user_report_service()', status: 'passed' },
            { name: 'test_tenant_domain_filter()', status: 'passed' },
            { name: 'test_database_fetch_active_users()', status: 'passed' },
            { name: 'test_invoice_creation_time()', status: 'passed' }
          ]);
          addLog('success', `🏆 SYSTEM STABILITY ACHIEVED: 100/100 tests passed deterministically. Total reset cost: ${isDI ? '0.00ms (Hermetic)' : '24.6ms (High DB overhead)'}`);
          onActionComplete('Sovereign Architect');
        } else {
          // Failure due to singletons crosstalk
          setTests([
            { name: 'test_user_report_service()', status: 'passed' },
            { 
              name: 'test_tenant_domain_filter()', 
              status: 'failed', 
              error: 'AssertionError: Expected Tenant "Beta", got "Alpha"',
              leakageTrace: 'Leakage source: CurrentUser::instance() state retained from preceding test run.'
            },
            { 
              name: 'test_database_fetch_active_users()', 
              status: 'failed', 
              error: 'PDOException: Connection locked on previous tenant transaction context',
              leakageTrace: 'Leakage source: TenantContext::instance() held active transaction.'
            },
            { name: 'test_invoice_creation_time()', status: 'passed' }
          ]);
          addLog('error', '❌ CRITICAL TEST FAILURE: 2 tests failed due to mutable state spillover! Tests crosstalk detected.');
        }
        return;
      }

      setTestRunnerStep(step);
      
      // Update the permutations checked
      const checkedPerms = Math.min(totalPermutations - 1, Math.floor((step / totalSteps) * totalPermutations));
      setActiveCombIndex(checkedPerms);

      // Phase transitions based on percentage of grid covered
      const percent = (step / totalSteps);
      if (percent >= 0.25 && percent < 0.5 && activeRunTestIdx === 0) {
        setActiveRunTestIdx(1);
        setTests(prev => {
          const next = [...prev];
          if (next[0]) next[0].status = 'passed';
          if (next[1]) next[1].status = 'running';
          return next;
        });
        addLog('success', '✓ [Thread-1] test_user_report_service() passed successfully.');
      } else if (percent >= 0.5 && percent < 0.75 && activeRunTestIdx === 1) {
        setActiveRunTestIdx(2);
        if (isDI || isTestResetInjected) {
          addLog('success', '✓ [Thread-2] test_tenant_domain_filter() passed cleanly.');
          setTests(prev => {
            const next = [...prev];
            if (next[1]) next[1].status = 'passed';
            if (next[2]) next[2].status = 'running';
            return next;
          });
        } else {
          addLog('error', '✗ [Thread-2] test_tenant_domain_filter() failed!', 'State pollution! Found leaked "UserAlpha" from previous run.');
          setTests(prev => {
            const next = [...prev];
            if (next[1]) next[1] = {
              name: 'test_tenant_domain_filter()',
              status: 'failed',
              error: 'AssertionError: Expected Tenant "Beta", got "Alpha"',
              leakageTrace: 'Leakage source: CurrentUser::instance() state retained.'
            };
            if (next[2]) next[2].status = 'running';
            return next;
          });
        }
      } else if (percent >= 0.75 && percent < 0.95 && activeRunTestIdx === 2) {
        setActiveRunTestIdx(3);
        if (isDI || isTestResetInjected) {
          addLog('success', '✓ [Thread-3] test_database_fetch_active_users() passed cleanly.');
          setTests(prev => {
            const next = [...prev];
            if (next[2]) next[2].status = 'passed';
            if (next[3]) next[3].status = 'running';
            return next;
          });
        } else {
          addLog('error', '✗ [Thread-3] test_database_fetch_active_users() failed!', 'Database locked! TenantContext left with open transaction.');
          setTests(prev => {
            const next = [...prev];
            if (next[2]) next[2] = {
              name: 'test_database_fetch_active_users()',
              status: 'failed',
              error: 'PDOException: Connection locked on previous context',
              leakageTrace: 'Leakage source: TenantContext::instance() held transaction.'
            };
            if (next[3]) next[3].status = 'running';
            return next;
          });
        }
      }
    }, difficulty === 'blog' ? 140 : difficulty === 'shop' ? 100 : 70);
  };

  // --- TEST RUNNER SNAKE PATH TRACING CALCULATIONS ---
  const getSnakeTrail = (): Position[] => {
    if (!isTestingRunning || testRunnerStep < 0) return [];
    const coveragePath = getGridCoveragePath();
    const trail: Position[] = [];
    for (let i = 0; i < 4; i++) {
      const posIdx = testRunnerStep - i;
      if (posIdx >= 0 && posIdx < coveragePath.length) {
        trail.push(coveragePath[posIdx]);
      }
    }
    return trail;
  };

  const activeSnakeTrail = getSnakeTrail();
  const isCellInTrail = (x: number, y: number) => {
    return activeSnakeTrail.slice(1).some(p => p.x === x && p.y === y);
  };
  const isCellSnakeHead = (x: number, y: number) => {
    if (!isTestingRunning || activeSnakeTrail.length === 0) return false;
    const head = activeSnakeTrail[0];
    return head && head.x === x && head.y === y;
  };

  const handleResetSingletons = () => {
    setGlobalUserState('NULL');
    setGlobalTenantState('NULL');
    setHasMutatedState(false);
    setRedirectedToQ(false);
    setPlayerPosition({ x: 0, y: 0 });
    addLog('system', 'Global Database/User singleton states manually PURGED. Environment reset to empty null state.');
  };

  return (
    <div className="flex min-h-0 flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Visual Title Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500 border border-amber-500/20">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="font-display font-semibold text-slate-100 text-sm tracking-wide uppercase">Labyrinth Simulation</span>
            <p className="text-slate-400 text-xs font-mono">Phase: {phase.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Action Controls & Monitors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* START TESTING SUITE BUTTON */}
          <button
            onClick={runTestSuite}
            disabled={isTestingRunning}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-tight transition-all flex items-center gap-2 ${
              isTestingRunning
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse cursor-not-allowed shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                : 'bg-gradient-to-r from-rose-500/15 to-rose-600/10 hover:from-rose-500/25 hover:to-rose-600/15 border-rose-500/40 hover:border-rose-500/60 text-rose-300 active:scale-95 shadow-[0_2px_8px_rgba(244,63,94,0.05)]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isTestingRunning ? 'animate-spin' : 'fill-rose-400'}`} />
            <span>{isTestingRunning ? 'Testing Labyrinth Sweep...' : 'Start Testing Suite ⚡'}</span>
          </button>

          {/* Global State Telemetry Monitor (Archaeological Honesty) */}
          {(phase === 'folklore_chaos' || phase === 'map_lying' || phase === 'testing_fever') && (
            <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Ambient Register</span>
                <span className="text-xs font-mono text-amber-400">
                  User: {globalUserState === 'NULL' ? '⚠️ NULL' : globalUserState} | Tenant: {globalTenantState === 'NULL' ? '⚠️ NULL' : globalTenantState}
                </span>
              </div>
              {hasMutatedState && (
                <button 
                  onClick={handleResetSingletons}
                  title="Trigger Manual State Reset (Must be done in test suites)"
                  className="p-1 px-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] uppercase font-mono rounded hover:bg-rose-500/20 transition-all flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
          )}

          {phase === 'dependency_injection' && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-400 font-mono text-xs">
              <ShieldCheck className="w-4 h-4" /> STATE ISOLATED
            </div>
          )}
        </div>
      </div>

      {/* System Complexity / Architecture Select Selector */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" /> SYSTEM ARCHETYPE & ROUTING COMPLEXITY
          </span>
          <p className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed">
            Choose standard system profiles. Increasing scale adds more architectural bottlenecks and walls (cart checks, ledgers), showing how singletons lock down traversal.
          </p>
        </div>
        
        <div className="flex gap-2 self-start sm:self-center">
          {(['blog', 'shop', 'erp'] as const).map((level) => {
            const isActive = difficulty === level;
            let icon = <FileCode className="w-4 h-4" />;
            let label = 'Blog';
            let complexity = 'Simple';
            
            if (level === 'shop') {
              icon = <Compass className="w-4 h-4" />;
              label = 'Shop';
              complexity = 'Moderate';
            } else if (level === 'erp') {
              icon = <Server className="w-4 h-4" />;
              label = 'ERP';
              complexity = 'Complex';
            }

            return (
              <button
                key={level}
                onClick={() => {
                  setDifficulty(level);
                  setPlayerPosition({ x: 0, y: 0 });
                  setStepSequence(['Entrance (0,0)']);
                  setVisitedCount(0);
                  setRedirectedToQ(false);
                  addLog('system', `Scaled target architecture to: ${label.toUpperCase()} (${complexity})`, `Labyrinth structures updated, repositioned Developer back to entrance.`);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {icon}
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-bold">{label}</span>
                  <span className="text-[9px] opacity-60 font-normal">{complexity}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Board View */}
      <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col xl:flex-row gap-6 overflow-visible xl:overflow-y-auto">
        {/* COLUMN 1: GAME GRID CONTAINER */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-slate-950 border border-slate-800 rounded-xl relative max-w-full">
            
            {/* Draw Path Cables in DI Phase to make visual explicit links */}
            {phase === 'dependency_injection' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" strokeDasharray="5,5">
                {/* Horizontal line from DI configuration to Exit representing wiring */}
                <line x1="20%" y1="20%" x2="70%" y2="70%" stroke="#10b981" strokeWidth="2" />
                <line x1="60%" y1="10%" x2="30%" y2="80%" stroke="#3b82f6" strokeWidth="2" />
              </svg>
            )}

            {/* Real-time SVG leakage pathways showing crosstalk flow */}
            {phase === 'testing_fever' && !isTestResetInjected && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible" strokeDasharray="5,5">
                <style>{`
                  @keyframes dash {
                    to {
                      stroke-dashoffset: -20;
                    }
                  }
                  .animate-crosstalk-leak {
                    animation: dash 1s linear infinite;
                  }
                `}</style>
                
                {/* USER Pollution flow line (from 3,0 to 4,1) */}
                {(!isTestingRunning || testRunnerStep >= 10) && (
                  <>
                    <path
                      d={`M ${(3.5 / 6) * 100}% ${(0.5 / 6) * 100}% Q 65% 15%, ${(4.5 / 6) * 100}% ${(1.5 / 6) * 100}%`}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="3.5"
                      className="animate-crosstalk-leak drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                    />
                    <circle cx={`${(3.5 / 6) * 100}%`} cy={`${(0.5 / 6) * 100}%`} r="5" fill="#f43f5e" className="animate-ping" />
                    <circle cx={`${(4.5 / 6) * 100}%`} cy={`${(1.5 / 6) * 100}%`} r="5" fill="#f43f5e" className="animate-ping" />
                  </>
                )}

                {/* DB context-lock flow line (from 1,1 to 4,1) */}
                {(!isTestingRunning || testRunnerStep >= 14) && (
                  <>
                    <path
                      d={`M ${(1.5 / 6) * 100}% ${(1.5 / 6) * 100}% Q 50% 30%, ${(4.5 / 6) * 100}% ${(1.5 / 6) * 100}%`}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="3.5"
                      className="animate-crosstalk-leak drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                    />
                    <circle cx={`${(1.5 / 6) * 100}%`} cy={`${(1.5 / 6) * 100}%`} r="5" fill="#f43f5e" className="animate-ping" />
                  </>
                )}
              </svg>
            )}

            {/* floating labels indicating active crosstalk leaks */}
            {phase === 'testing_fever' && !isTestResetInjected && (!isTestingRunning || testRunnerStep >= 10) && (
              <div 
                className="absolute text-[8px] leading-none bg-rose-950 border border-rose-500 text-rose-300 font-mono font-bold rounded px-1.5 py-1 animate-bounce z-30 shadow-[0_2px_8px_rgba(244,63,94,0.5)]"
                style={{ left: '60%', top: '13%' }}
              >
                <span>⚠️ USER STATE POLLUTION</span>
              </div>
            )}
            
            {phase === 'testing_fever' && !isTestResetInjected && (!isTestingRunning || testRunnerStep >= 14) && (
              <div 
                className="absolute text-[8px] leading-none bg-rose-950 border border-rose-500 text-rose-300 font-mono font-bold rounded px-1.5 py-1 animate-bounce z-30 shadow-[0_2px_8px_rgba(244,63,94,0.5)]"
                style={{ left: '33%', top: '28%', animationDelay: '0.2s' }}
              >
                <span>⚠️ DB CONNECTION LOCKED</span>
              </div>
            )}

            {gridMap.flat().map((tile) => {
              const { x, y } = tile;
              const isPlayerHere = playerPosition.x === x && playerPosition.y === y;
              const isAdjacent = Math.abs(x - playerPosition.x) + Math.abs(y - playerPosition.y) === 1;
              const canMoveTo = tile.type !== 'wall' && isAdjacent;

              let bgStyle = 'bg-slate-900 border-slate-800 text-slate-400';
              let glowStyle = '';

              if (canMoveTo) {
                bgStyle = 'bg-slate-900 border-slate-800 hover:bg-slate-800/80 hover:border-amber-500/40 text-slate-300';
              }

              // Apply snake and runner path overlays in real-time
              const isSnakeHead = isCellSnakeHead(x, y);
              const isSnakeTrailPart = isCellInTrail(x, y);

              if (isSnakeHead) {
                glowStyle = phase === 'dependency_injection' 
                  ? 'ring-2 ring-emerald-500 scale-[1.03] shadow-[0_0_15px_#10b981]' 
                  : (isTestResetInjected ? 'ring-2 ring-amber-400 scale-[1.03] shadow-[0_0_12px_#fbbf24]' : 'ring-2 ring-rose-500 scale-[1.03] shadow-[0_0_15px_#f43f5e]');
              } else if (isSnakeTrailPart) {
                bgStyle = phase === 'dependency_injection'
                  ? 'bg-emerald-950/40 border-emerald-500/30'
                  : (isTestResetInjected ? 'bg-amber-950/20 border-amber-500/25' : 'bg-rose-950/30 border-rose-500/25');
              }

              // Colors & states based on grid structure
              if (tile.type === 'wall') {
                bgStyle = 'bg-slate-800 border-slate-700 text-slate-800 shadow-inner';
              } else if (tile.type === 'entrance') {
                bgStyle = isPlayerHere 
                  ? 'bg-slate-900 border-dashed border-amber-500/50 text-amber-500 font-mono'
                  : 'bg-slate-900/60 border-dashed border-slate-700 text-slate-500 font-mono';
              } else if (tile.type === 'exit') {
                bgStyle = 'bg-emerald-950 border-emerald-500/50 text-emerald-400 font-mono ring-2 ring-emerald-500/10';
              } else if (tile.type === 'trapdoor' && tile.trapdoorId) {
                const conf = TRAPDOORS_CONFIG[tile.trapdoorId];
                bgStyle = 'border-dashed font-mono text-slate-200';
                glowStyle = 'trapdoor-glow scale-[1.03] animate-pulse-slow';
              } else if (tile.type === 'signpost') {
                bgStyle = 'bg-slate-900 border-emerald-500/30 text-emerald-400 font-mono border-2';
              }

              // Room B / Room Q Visual Styling during chromatography scan phase
              if (phase === 'map_lying') {
                if (tile.label === 'RM_B') {
                  bgStyle = 'bg-blue-950/40 border-blue-500/50 text-blue-400';
                } else if (tile.label === 'RM_Q') {
                  bgStyle = redirectedToQ 
                    ? 'bg-rose-950 border-rose-500 text-rose-400 font-bold scale-[1.05] ring-2 ring-rose-500/20' 
                    : 'bg-slate-900 border-slate-800 text-slate-500';
                }
              }

              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => canMoveTo && moveCharacter(x - playerPosition.x, y - playerPosition.y)}
                  className={`
                    size-11 sm:size-12 md:size-14 rounded-lg border flex flex-col items-center justify-center transition-all relative select-none
                    ${canMoveTo ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}
                    ${bgStyle} ${glowStyle}
                  `}
                  style={tile.type === 'trapdoor' && tile.trapdoorId ? { 
                    borderColor: TRAPDOORS_CONFIG[tile.trapdoorId]?.color,
                    color: TRAPDOORS_CONFIG[tile.trapdoorId]?.color,
                    background: `${TRAPDOORS_CONFIG[tile.trapdoorId]?.color}10`
                  } : {}}
                >
                  {/* Subtle adjacent indicator dot */}
                  {canMoveTo && (
                    <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500/40 inline-block pointer-events-none" />
                  )}

                  {/* Test Snake Head Pulsing Node */}
                  {isTestingRunning && isSnakeHead && (
                    <div className={`absolute inset-1 w-12 h-12 rounded-full flex items-center justify-center animate-pulse z-20 ${
                      phase === 'dependency_injection'
                        ? 'bg-emerald-400 text-emerald-950 border border-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                        : isTestResetInjected
                          ? 'bg-amber-400 text-amber-950 border border-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                          : 'bg-rose-500 text-rose-50 border border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
                    }`}>
                      <span className="text-[7px] font-mono leading-none font-bold">TEST</span>
                    </div>
                  )}

                  {/* Test Snake Tail Bubble */}
                  {isTestingRunning && isSnakeTrailPart && !isSnakeHead && (
                    <div className={`absolute size-3.5 rounded-full ${
                      phase === 'dependency_injection'
                        ? 'bg-emerald-500/60 shadow-[0_0_4px_#10b981]'
                        : isTestResetInjected
                          ? 'bg-amber-500/40 shadow-[0_0_4px_#f59e0b]'
                          : 'bg-rose-500/50 shadow-[0_0_4px_#f43f5e]'
                    } z-10`} />
                  )}

                  {/* Render Player Icon with elegant Framer Motion transition */}
                  <AnimatePresence>
                    {isPlayerHere && (
                      <motion.div
                        layoutId="heroDev"
                        initial={{ scale: 0.6, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0.6 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="absolute inset-1 bg-amber-500 rounded-md border border-slate-950 shadow-lg text-slate-950 flex items-center justify-center flex-col z-10"
                      >
                        <span className="text-[10px] font-mono leading-none tracking-tighter">DEV</span>
                        <Zap className="w-3 h-3 fill-slate-950 mt-0.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tile details */}
                  {!isPlayerHere && (
                    <div className="text-center font-display pointer-events-none">
                      <span className="text-[10px] font-bold tracking-tight block">{tile.label || `${x},${y}`}</span>
                      {tile.subtitle && (
                        <span className="text-[7px] text-slate-500 font-mono tracking-tighter uppercase block mt-0.5">{tile.subtitle}</span>
                      )}
                    </div>
                  )}

                  {/* Hover tooltip for trapdoor code calls */}
                  {!isPlayerHere && tile.type === 'trapdoor' && tile.trapdoorId && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden hover:block group-hover:block bg-slate-950 border border-slate-800 text-[10px] p-1.5 rounded text-left w-36 shadow-xl z-30 font-mono">
                      <span className="text-amber-500 font-bold block">{TRAPDOORS_CONFIG[tile.trapdoorId].name}</span>
                      <span className="text-slate-400 max-w-full overflow-hidden block truncate">{TRAPDOORS_CONFIG[tile.trapdoorId].codeSnippet}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Touch/Button Directional Controller pad (Great for iframe bounds!) */}
          <div className="mt-5 flex flex-col items-center">
            <div className="flex gap-1">
              <button 
                onClick={() => moveCharacter(0, -1)}
                className="w-10 h-10 bg-slate-950 border border-slate-800 hover:border-slate-700 active:bg-slate-900 rounded-lg flex items-center justify-center text-slate-300 shadow-md group transition-all"
              >
                <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="flex gap-1 mt-1">
              <button 
                onClick={() => moveCharacter(-1, 0)}
                className="w-10 h-10 bg-slate-950 border border-slate-800 hover:border-slate-700 active:bg-slate-900 rounded-lg flex items-center justify-center text-slate-300 shadow-md group transition-all"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div
                title="Singleton trapdoors auto-fire the moment you touch them"
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border border-dashed border-slate-700 bg-slate-950/60 text-slate-500"
              >
                AUTO
              </div>
              <button 
                onClick={() => moveCharacter(1, 0)}
                className="w-10 h-10 bg-slate-950 border border-slate-800 hover:border-slate-700 active:bg-slate-900 rounded-lg flex items-center justify-center text-slate-300 shadow-md group transition-all"
              >
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            <div className="flex gap-1 mt-1">
              <button 
                onClick={() => moveCharacter(0, 1)}
                className="w-10 h-10 bg-slate-950 border border-slate-800 hover:border-slate-700 active:bg-slate-900 rounded-lg flex items-center justify-center text-slate-300 shadow-md group transition-all"
              >
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-2">Keyboard Arrow Keys/W-A-S-D move. Singleton trapdoors auto-fire on contact.</span>
          </div>

          {/* INTEGRATED TESTING CABINET (Unified Labs + State-Space Matrix) */}
          {(phase === 'testing_fever' || phase === 'dependency_injection') && (
            <div className="w-full mt-6 bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-4">
              {/* Cabinet Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-200 tracking-wide uppercase">Integrated Testing Cabinet</span>
                </div>
                {isTestResetInjected || phase === 'dependency_injection' ? (
                  <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold tracking-wider uppercase">
                    Hermetic PASS 🛡️
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-extrabold tracking-wider uppercase animate-pulse">
                    Crosstalk FAILING ⚠️
                  </span>
                )}
              </div>

              {/* Performance overhead meters */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900 border border-slate-800/60 p-2 rounded-lg text-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tight block">Sandbox Isolation</span>
                  <span className={`text-xs font-mono font-bold block mt-1 ${
                    phase === 'dependency_injection' ? 'text-emerald-400' : isTestResetInjected ? 'text-amber-400' : 'text-rose-500'
                  }`}>
                    {phase === 'dependency_injection' ? '100% Hermetic' : isTestResetInjected ? '50% (Dirty)' : '0% (Crosstalk)'}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800/60 p-2 rounded-lg text-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tight block">Database Reset Cost</span>
                  <span className="text-xs font-mono font-bold text-slate-300 block mt-1">
                    {phase === 'dependency_injection' ? '0.00ms (Explicit)' : isTestResetInjected ? '24.6ms (High DB Reset)' : 'N/A'}
                  </span>
                </div>
              </div>

              {/* State-Space Matrix visualization: Matrix representing combination permutations */}
              <div className="bg-slate-900 border border-slate-800/60 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-tight font-medium flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-pink-500" /> State-Space Permutation Matrix
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{activeCombIndex + 1}/{difficulty === 'blog' ? 4 : difficulty === 'shop' ? 18 : 96} vectors</span>
                </div>
                
                {/* Grid layout of combinations checked */}
                <div className="flex flex-wrap gap-1 justify-start">
                  {Array.from({ length: difficulty === 'blog' ? 4 : difficulty === 'shop' ? 18 : 42 }).map((_, i) => {
                    const isChecked = activeCombIndex >= i;
                    let dotColor = 'bg-slate-800 border-slate-750';
                    if (isChecked) {
                      dotColor = phase === 'dependency_injection' 
                        ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' 
                        : isTestResetInjected 
                          ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' 
                          : 'bg-rose-500 shadow-[0_0_6px_#f43f5e]';
                    }
                    return (
                      <div 
                        key={i} 
                        className={`w-3 h-3 rounded-full border transition-all duration-300 ${dotColor}`}
                        title={`Execution Vector ${i + 1}`}
                      />
                    );
                  })}
                  {difficulty === 'erp' && <span className="text-[8px] font-mono text-slate-600 self-center pl-1">+54 more</span>}
                </div>
                <p className="text-[9px] text-slate-500 leading-normal">
                  {phase === 'dependency_injection' 
                    ? "Independent micro-sandboxes resolve all verification processes concurrently with zero state contamination."
                    : "Sequential test suite executions walk over the system structures. If static registries holding tenant variables aren't purged, preceding state leaks into next test cases."
                  }
                </p>
              </div>

              {/* Active Test Cases Progress */}
              <div className="space-y-1.5 pt-1">
                {tests.map((test, idx) => {
                  let badgeColor = 'bg-slate-900 text-slate-500 border-slate-800';
                  let textClass = 'text-slate-400';
                  if (test.status === 'running') {
                    badgeColor = 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30 animate-pulse';
                    textClass = 'text-indigo-200';
                  } else if (test.status === 'passed') {
                    badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20';
                    textClass = 'text-slate-400 line-through';
                  } else if (test.status === 'failed') {
                    badgeColor = 'bg-rose-950/40 text-rose-400 border-rose-500/20';
                    textClass = 'text-rose-200';
                  }

                  return (
                    <div key={idx} className="bg-slate-900 hover:bg-slate-900/80 border border-slate-850 p-2 rounded-lg flex flex-col space-y-1 select-none">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-mono tracking-tight font-medium ${textClass}`}>
                          {test.name}
                        </span>
                        <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded ${badgeColor}`}>
                          {test.status.toUpperCase()}
                        </span>
                      </div>
                      {test.error && (
                        <div className="border-t border-rose-900/20 pt-1 mt-1 font-mono">
                          <span className="text-[9.5px] text-rose-400 block break-words">{test.error}</span>
                          {test.leakageTrace && (
                            <span className="text-[8.5px] text-slate-500 block italic leading-tight pl-2 border-l border-rose-500/30 mt-0.5">
                              ↳ {test.leakageTrace}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Interactive State Shield Toggle Action */}
              {phase === 'testing_fever' && (
                <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
                  <label className="flex items-start gap-2.5 cursor-pointer relative select-none">
                    <input 
                      type="checkbox"
                      checked={isTestResetInjected}
                      onChange={(e) => {
                        setIsTestResetInjected(e.target.checked);
                        if (e.target.checked) {
                          addLog('success', '🛡️ beforeEach() HOOK INSTALLED: Configured CurrentUser::reset() & TenantContext::shutdown() registers.');
                        } else {
                          addLog('warning', '⚠️ RESET HOOK DETACHED: Isolation shield disabled. Global singletons exposed.');
                        }
                      }}
                      className="mt-1 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wide">
                        Install beforeEach() Teardown Shield
                      </span>
                      <p className="text-[9.5px] text-slate-500 mt-0.5 leading-snug">
                        Instructs the test runner to clean up global registries before each case. Plugs state leakage, but increases DB load.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 2: INTERACTIVE PHASE CHALLENGE GUIDES */}
        <div className="w-full xl:w-80 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-800 pt-6 xl:pt-0 xl:pl-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-mono font-medium uppercase text-amber-500 tracking-wider">Phase Challenge</span>
            
            {/* Phase 1 Normal Walk through info */}
            {phase === 'classic_corridor' && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="text-sm font-semibold text-slate-200">The Honest Map</h4>
                <p className="text-xs text-slate-400">
                  Observe how walking creates a linear, understandable trail under the terminal logs stack trace. Every path starts and stops explicitly.
                </p>
                <div className="text-[11px] bg-slate-900 border border-slate-800 p-2 text-slate-400 rounded font-mono">
                  Steps taken: <span className="text-amber-500">{visitedCount}</span>
                </div>
              </div>
            )}

            {/* Phase 2 Shortcut Info */}
            {phase === 'first_shortcut' && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="text-sm font-semibold text-slate-200 text-emerald-400">The Convenient Bait</h4>
                <p className="text-xs text-slate-400">
                  Step onto cell <strong className="text-emerald-400">DB (1,1)</strong> and get yanked away instantly. Hidden shortcuts do not wait for consent.
                </p>
                <div className="flex items-center gap-2 p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[11px]">
                  <Zap className="w-3 h-3 text-emerald-400" /> Convenient, but dangerous.
                </div>
              </div>
            )}

            {/* Phase 3 Folklore Chaos */}
            {phase === 'folklore_chaos' && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="text-sm font-semibold text-slate-200 text-purple-400">Underground Complications</h4>
                <p className="text-xs text-slate-400">
                  Try activating portals on purpose. Watch how they pollute global context, changing database resolution triggers downstream!
                </p>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-slate-500">PORTAL REGISTRIES:</div>
                  <div className="text-[11px] font-mono flex justify-between bg-slate-900 p-1 px-2 rounded">
                    <span style={{ color: '#10b981' }}>Database::instance</span>
                    <span className="text-emerald-400">State: {globalTenantState !== 'NULL' ? '⚠️ Sharded' : 'Clean'}</span>
                  </div>
                  <div className="text-[11px] font-mono flex justify-between bg-slate-900 p-1 px-2 rounded">
                    <span style={{ color: '#ef4444' }}>CurrentUser::instance</span>
                    <span className="text-rose-400">State: {globalUserState !== 'NULL' ? 'Cached' : 'NULL'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 4 Map Lying & Archaeology */}
            {phase === 'map_lying' && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="text-sm font-semibold text-slate-200 text-rose-400">Investigation Scanner</h4>
                <p className="text-xs text-slate-400">
                  Walk to cell (3,4) labelled <strong className="text-blue-400">RM_B</strong>. Stale global context will instead hijack your position, throwing you in Q!
                </p>

                <button
                  onClick={runArcheologyScan}
                  disabled={!redirectedToQ || isArcheologyScanning}
                  className={`
                    w-full py-2 rounded-lg font-semibold text-xs font-mono flex items-center justify-center gap-2 border transition-all
                    ${redirectedToQ 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95' 
                      : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'}
                  `}
                >
                  <Search className={`w-4 h-4 ${isArcheologyScanning ? 'animate-spin' : ''}`} />
                  {isArcheologyScanning ? 'SCANNING HEAP...' : 'RUN ARCHEOLOGY SCAN'}
                </button>
              </div>
            )}

             {/* Phase 5 Testing Nightmare Narrative info */}
            {phase === 'testing_fever' && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="text-sm font-semibold text-slate-200">The Crosstalk Incident</h4>
                <p className="text-xs text-slate-400">
                  The team scaled up from a simple blog to complex ERP structures, writing parallel tests. But the global registries are leaking variables between parallel processes!
                </p>
                <p className="text-[11px] text-slate-500 leading-normal">
                  In order to resolve QA blockades, inspect the integrated <strong className="text-amber-500">Testing Cabinet</strong> beneath the grid to diagnose failures and equip the setup reset hook.
                </p>
              </div>
            )}

            {/* Phase 6 Refactored DI Cleanliness Narrative info */}
            {phase === 'dependency_injection' && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="text-sm font-semibold text-emerald-400 text-glow">Explicit Sandbox</h4>
                <p className="text-xs text-slate-400">
                  By refactoring singletons to Explicit Dependency Injection, state is local to each instance instead of living in process memory.
                </p>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Parallel tests now run with perfect multithreaded speed and zero shared garbage collections. Notice the stats overhead details in the <strong className="text-emerald-400">Testing Cabinet</strong> beneath the grid.
                </p>
              </div>
            )}

            {/* Archeology Diagnostic Output */}
            {archeologyReport && phase === 'map_lying' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 border border-slate-800 p-3 rounded-xl max-h-40 overflow-y-auto"
              >
                <div className="flex items-center gap-1 text-amber-500 text-[10px] uppercase font-mono font-semibold mb-1">
                  <Search className="w-3.5 h-3.5" /> Excavation Log
                </div>
                <pre className="text-[8.5px] font-mono text-slate-300 leading-tight whitespace-pre-wrap">
                  {archeologyReport}
                </pre>
              </motion.div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>PATH STEPS TAKEN:</span>
              <span className="text-slate-400 font-bold">{stepSequence.length}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-[8px] font-mono">
              {stepSequence.slice(-3).map((s, idx) => (
                <span key={idx} className="bg-slate-950 border border-slate-800 text-slate-400 rounded px-1.5 py-0.5 truncate max-w-[110px]">
                  {s}
                </span>
              ))}
              {stepSequence.length > 3 && <span className="text-slate-600">...</span>}
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER TERMINAL MONITOR (Predictable logs stack trace) */}
      <div className="bg-slate-950 border-t border-slate-800 p-3">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 uppercase">
            <Terminal className="w-3.5 h-3.5 text-slate-500" /> Stack Trace Console
          </span>
          <button 
            onClick={() => setLogs([])}
            className="text-[9px] font-mono text-slate-500 hover:text-slate-300 hover:underline transition-all"
          >
            Clear console
          </button>
        </div>
        
        <div
          ref={consoleScrollRef}
          aria-label="Stack Trace Console Output"
          className="h-28 bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-lg overflow-y-auto font-mono text-xs text-slate-400 space-y-1"
        >
          {logs.length === 0 ? (
            <div className="text-slate-600 italic text-center pt-8 text-[11px]">Console idle. Push keys/arrows or walk about to trigger trace signals...</div>
          ) : (
            logs.map((log) => {
              let logStyle = 'text-slate-400';
              let badge = '[info]';
              if (log.type === 'success') {
                logStyle = 'text-emerald-400';
                badge = '[pass]';
              } else if (log.type === 'warning') {
                logStyle = 'text-amber-400';
                badge = '[warn]';
              } else if (log.type === 'error') {
                logStyle = 'text-rose-400';
                badge = '[fail]';
              } else if (log.type === 'archeology') {
                logStyle = 'text-cyan-400';
                badge = '[arch]';
              } else if (log.type === 'system') {
                logStyle = 'text-indigo-400 font-semibold';
                badge = '[boot]';
              }

              return (
                <div key={log.id} className="leading-normal hover:bg-slate-800/40 p-0.5 rounded transition-colors text-[10px]">
                  <span className="text-slate-600 mr-1.5">[{log.timestamp}]</span>
                  <span className={`${logStyle} font-bold mr-1.5`}>{badge}</span>
                  <span className="text-slate-200">{log.message}</span>
                  {log.details && (
                    <span className="block pl-16 text-slate-500 text-[9.5px]">↳ {log.details}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
