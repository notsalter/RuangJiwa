import type { Backend, Collection, Collections, PrivateCollection, State } from './types';
import { safeError } from './config';
export class Session {
  private state: State = { user: null, profile: null, ready: false, data: {} };
  private listeners = new Set<() => void>();
  private epoch = 0;
  private blocked = false;
  private queries = new Map<Collection, number>();
  constructor(readonly backend: Backend | null) { if (!backend) this.state.ready = true; }
  snapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit(patch: Partial<State>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(listener => listener()); }
  start() {
    return this.backend?.observe(user => {
      if (this.blocked && user) return;
      if (user?.uid !== this.state.user?.uid) { this.epoch++; this.queries.clear(); this.emit({ user, profile: null, data: {}, ready: true, error: undefined }); }
      else this.emit({ user, ready: true });
      if (user) void this.refreshProfile();
    }, error => { this.epoch++; this.emit({ user: null, profile: null, data: {}, ready: true, error: safeError(error) }); }) ?? (() => {});
  }
  async login(email: string, password: string, register = false) {
    if (!this.backend) throw new Error('configuration-required');
    this.blocked = false;
    await this.backend.login(email.trim(), password, register);
  }
  async logout() {
    this.blocked = true; this.epoch++; this.queries.clear();
    this.emit({ user: null, profile: null, data: {}, ready: true, error: undefined });
    try { await this.backend?.logout(); } catch (error) { this.emit({ error: safeError(error) }); }
  }
  clearData() { this.epoch++; this.queries.clear(); this.emit({ profile: null, data: {} }); }
  async refreshProfile() {
    const uid = this.state.user?.uid, epoch = this.epoch;
    if (!uid || !this.backend) return;
    try { const profile = await this.backend.profile(uid); if (epoch === this.epoch) this.emit({ profile }); }
    catch (error) { if (epoch === this.epoch) this.emit({ error: safeError(error) }); }
  }
  async load<K extends Collection>(name: K) {
    const uid = this.state.user?.uid, epoch = this.epoch;
    if (!uid || !this.backend) return;
    const sequence = (this.queries.get(name) ?? 0) + 1; this.queries.set(name, sequence);
    const put = (value: { items: Collections[K][]; loading: boolean; error?: string }) => this.emit({ data: { ...this.state.data, [name]: value } });
    put({ items: this.state.data[name]?.items as Collections[K][] ?? [], loading: true });
    try { const items = await this.backend.list(name, uid); if (epoch === this.epoch && this.queries.get(name) === sequence) put({ items: items.filter(item => !('userId' in item) || item.userId === uid), loading: false }); }
    catch (error) { if (epoch === this.epoch && this.queries.get(name) === sequence) put({ items: [], loading: false, error: safeError(error) }); }
  }
  private async mutate(name: PrivateCollection, action: (uid: string) => Promise<void>) {
    const uid = this.state.user?.uid, epoch = this.epoch;
    if (!uid || !this.backend) throw new Error('session-required');
    try { await action(uid); } catch (error) { if (epoch !== this.epoch) return false; throw error; }
    if (epoch !== this.epoch) return false;
    await this.load(name); return epoch === this.epoch;
  }
  create(name: PrivateCollection, data: Record<string, unknown>) { return this.mutate(name, uid => this.backend!.create(name, uid, data)); }
  update(name: PrivateCollection, id: string, data: Record<string, unknown>) { return this.mutate(name, uid => this.backend!.update(name, uid, id, data)); }
  remove(id: string) { return this.mutate('journals', uid => this.backend!.remove('journals', uid, id)); }
  async saveProfile(name: string, photo?: File) {
    const uid = this.state.user?.uid, epoch = this.epoch;
    if (!uid || !this.backend) throw new Error('session-required');
    await this.backend.saveProfile(uid, name, photo);
    if (epoch !== this.epoch) return false;
    await this.refreshProfile(); return epoch === this.epoch;
  }
}
