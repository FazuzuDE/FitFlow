export type AuthIdentity = { id: string; email: string | null };

export type AuthRepository = {
  getIdentity(): Promise<AuthIdentity | null>;
  onAuthChange(listener: (identity: AuthIdentity | null) => void): () => void;
  sendEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(email: string, code: string): Promise<AuthIdentity>;
  signOut(): Promise<void>;
  dispose(): void;
};
