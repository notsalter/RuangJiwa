import { useLayoutEffect, useState, useRef } from "preact/hooks";
import { Session } from "../core/session";
import { useSession } from "../core/hooks";
import { ownedAvatarPath } from "../services/avatar";

export function useAvatar(session: Session) {
  const snapshot = useSession(session);
  const [retry, setRetry] = useState(0);
  const release = useRef<() => void>(() => {});
  const [image, setImage] = useState<{ profile: typeof snapshot.profile; uid?: string; url?: string; loading?: boolean; error?: string }>({profile: null});
  useLayoutEffect(() => {
    const profile = session.snapshot().profile;
    const uid = session.snapshot().user?.uid;
    const path = uid && profile?.id === uid ? ownedAvatarPath(uid, profile.profileImagePath) : undefined;
    let active = true, url: string | undefined;
    const dispose = () => {
      active = false;
      if (url) { URL.revokeObjectURL(url); url = undefined; }
    };
    release.current = dispose;
    const stop = session.subscribe(() => {
      const next = session.snapshot();
      if (next.user?.uid !== uid || next.profile !== profile) dispose();
    });
    const offline = () => { dispose(); setImage({profile: null}); };
    window.addEventListener("offline", offline);
    setImage({profile, uid});
    if (uid && path && session.backend?.getPhoto && navigator.onLine) {
      setImage({profile, uid, loading: true});
      void session.backend.getPhoto(uid, path).then(blob => {
        const next = session.snapshot();
        if (!active || !navigator.onLine || next.user?.uid !== uid || next.profile !== profile) return;
        url = URL.createObjectURL(blob);
        setImage({profile, uid, url});
      }).catch(() => {
        if (active) setImage({profile, uid, error: "Foto gagal dimuat. Coba lagi saat online."});
      });
    }
    return () => { dispose(); stop(); window.removeEventListener("offline", offline); };
  }, [session, snapshot.user?.uid, snapshot.profile, retry]);
  const current = image.uid === snapshot.user?.uid && image.profile === snapshot.profile;
  return {
    url: current ? image.url : undefined,
    loading: current && image.loading,
    error: current ? image.error : undefined,
    retry: () => setRetry(value => value + 1),
    failed: () => {
      release.current();
      setImage({...image, url: undefined, loading: false, error: "Foto gagal ditampilkan. Coba lagi saat online."});
    },
  };
}
