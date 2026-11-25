import { useEffect, useState } from 'preact/hooks';
import { Session } from './session';
import type { Collection, QueryState, Collections } from './types';
export function useSession(session: Session) { const [state, set] = useState(session.snapshot()); useEffect(() => { const stop = session.subscribe(() => set(session.snapshot())); set(session.snapshot()); return stop; }, [session]); return state; }
export function useQuery<K extends Collection>(session: Session, name: K): QueryState<Collections[K]> {
  const state = useSession(session);
  useEffect(() => { void session.load(name); }, [session, name, state.user?.uid]);
  return state.data[name] as QueryState<Collections[K]> ?? { items: [], loading: true };
}
