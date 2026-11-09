const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/admin";

export type AdminRole = "SuperAdmin" | "Moderator" | "SafetyOfficer" | "FinanceManager" | "SupportSpecialist";

export interface AdminUser {
  email: string;
  name: string;
  role: AdminRole;
  avatar: string;
}

export interface AdminStats {
  pendingModerationCount: number;
  safetyFlagsCount: number;
  unverifiedSlipsCount: number;
  openTicketsCount: number;
  totalUsersCount: number;
  totalRevenueLkr: number;
}

export interface PendingProfile {
  id: string;
  code: string;
  name: string;
  gender: "bride" | "groom" | string;
  age: number;
  profession: string;
  location: string;
  religion: string;
  nicNumber: string;
  nicPhotoUrl: string;
  profilePhotoUrl: string;
  bio: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  snippet: string;
  riskLevel: "High" | "Medium" | "Low";
  reportedAt: string;
  status: "open" | "warned" | "banned" | "dismissed";
}

export interface FinanceSlip {
  id: string;
  userId: string;
  userName: string;
  planId: "gold" | "platinum" | string;
  durationMonths: number;
  amountLkr: number;
  bankName: string;
  referenceNumber: string;
  slipUrl: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: string;
  priority: "High" | "Normal";
  status: "open" | "resolved";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  staffName: string;
  role: string;
  action: string;
  details: string;
  ipAddress: string;
}

class AdminApiService {
  private getAuthHeader(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("aura_admin_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  getCurrentStaff(): AdminUser | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem("aura_admin_session");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setCurrentStaff(user: AdminUser | null) {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem("aura_admin_session", JSON.stringify(user));
    } else {
      localStorage.removeItem("aura_admin_session");
      localStorage.removeItem("aura_admin_token");
    }
  }

  async getStats(): Promise<AdminStats> {
    try {
      const res = await fetch(`${API_BASE}/stats`, { headers: this.getAuthHeader() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline stats fallback:", e);
    }
    return {
      pendingModerationCount: 3,
      safetyFlagsCount: 3,
      unverifiedSlipsCount: 2,
      openTicketsCount: 2,
      totalUsersCount: 1240,
      totalRevenueLkr: 485000,
    };
  }

  async getPendingProfiles(): Promise<PendingProfile[]> {
    try {
      const res = await fetch(`${API_BASE}/profiles`, { headers: this.getAuthHeader() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline profiles fallback:", e);
    }
    return [
      {
        id: "MP-24890",
        code: "MP-24890",
        name: "Tharindu Wijesekara",
        gender: "groom",
        age: 30,
        profession: "Senior Data Scientist",
        location: "Colombo 03",
        religion: "Buddhist",
        nicNumber: "199428901234",
        nicPhotoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop",
        profilePhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
        bio: "Master's graduate from Colombo University. Looking for an educated partner from a respectable family.",
        submittedAt: "10 mins ago",
        status: "pending",
      },
      {
        id: "MP-24891",
        code: "MP-24891",
        name: "Chathurika Madushani",
        gender: "bride",
        age: 27,
        profession: "Architect (B.Arch)",
        location: "Kandy",
        religion: "Buddhist",
        nicNumber: "199754329876",
        nicPhotoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop",
        profilePhotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
        bio: "Practicing chartered architect in Kandy. Enjoys traditional heritage, landscape gardening, and art.",
        submittedAt: "25 mins ago",
        status: "pending",
      },
      {
        id: "MP-24892",
        code: "MP-24892",
        name: "Dr. Sandun Alwis",
        gender: "groom",
        age: 33,
        profession: "Cardiothoracic Surgeon",
        location: "Melbourne / Colombo",
        religion: "Christian",
        nicNumber: "199187654321",
        nicPhotoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop",
        profilePhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
        bio: "Medical specialist currently in Australia. Seeking a kind and family-oriented life companion.",
        submittedAt: "1 hour ago",
        status: "pending",
      },
    ];
  }

  async approveProfile(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/profiles/${id}/approve`, {
        method: "POST",
        headers: this.getAuthHeader(),
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async rejectProfile(id: string, reason: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/profiles/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async getSafetyReports(): Promise<SafetyReport[]> {
    try {
      const res = await fetch(`${API_BASE}/safety`, { headers: this.getAuthHeader() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline safety fallback:", e);
    }
    return [
      {
        id: "REP-901",
        reporterId: "LK-8834",
        reportedUserId: "USR-4412",
        reportedUserName: "Gayan B. (Unverified)",
        reason: "money_scam",
        snippet: '"Please transfer Rs. 35,000 for emergency vehicle repair immediately, I will return tomorrow."',
        riskLevel: "High",
        reportedAt: "15 mins ago",
        status: "open",
      },
      {
        id: "REP-902",
        reporterId: "LK-7102",
        reportedUserId: "USR-7731",
        reportedUserName: "Crypto Match Promo",
        reason: "inappropriate_content",
        snippet: '"Join my foreign exchange investment group at http://crypto-win-now.xyz for 200% returns."',
        riskLevel: "High",
        reportedAt: "45 mins ago",
        status: "open",
      },
      {
        id: "REP-903",
        reporterId: "LK-9021",
        reportedUserId: "USR-1092",
        reportedUserName: "Kamal S.",
        reason: "harassment",
        snippet: "Repeatedly demanding personal phone number after request was declined.",
        riskLevel: "Medium",
        reportedAt: "2 hours ago",
        status: "open",
      },
    ];
  }

  async warnUser(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/safety/${id}/warn`, { method: "POST", headers: this.getAuthHeader() });
      return res.ok;
    } catch {
      return true;
    }
  }

  async banUser(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/safety/${id}/ban`, { method: "POST", headers: this.getAuthHeader() });
      return res.ok;
    } catch {
      return true;
    }
  }

  async dismissReport(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/safety/${id}/dismiss`, { method: "POST", headers: this.getAuthHeader() });
      return res.ok;
    } catch {
      return true;
    }
  }

  async getFinanceSlips(): Promise<FinanceSlip[]> {
    try {
      const res = await fetch(`${API_BASE}/finance`, { headers: this.getAuthHeader() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline finance fallback:", e);
    }
    return [
      {
        id: "SLIP-501",
        userId: "USR-8821",
        userName: "Nalaka Dissanayake",
        planId: "gold",
        durationMonths: 3,
        amountLkr: 6375,
        bankName: "Commercial Bank (Colombo 07 Branch)",
        referenceNumber: "TXN-COMB-982144",
        slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop",
        submittedAt: "18 mins ago",
        status: "pending",
      },
      {
        id: "SLIP-502",
        userId: "USR-9904",
        userName: "Dilini Fernando",
        planId: "platinum",
        durationMonths: 6,
        amountLkr: 29250,
        bankName: "Sampath Bank (Kandy City Centre)",
        referenceNumber: "TXN-SAMP-110293",
        slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop",
        submittedAt: "40 mins ago",
        status: "pending",
      },
    ];
  }

  async approveSlip(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/finance/${id}/approve`, { method: "POST", headers: this.getAuthHeader() });
      return res.ok;
    } catch {
      return true;
    }
  }

  async rejectSlip(id: string, reason: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/finance/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.getAuthHeader() },
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    try {
      const res = await fetch(`${API_BASE}/support`, { headers: this.getAuthHeader() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline support fallback:", e);
    }
    return [
      {
        id: "TCK-101",
        userName: "Chandrika Bandara",
        userEmail: "chandrika.b@gmail.com",
        subject: "How do I update my horoscope rasi details?",
        message: "I uploaded my rasi chart during registration, but need to add navamsha details.",
        category: "Account",
        priority: "Normal",
        status: "open",
        createdAt: "30 mins ago",
      },
      {
        id: "TCK-102",
        userName: "Sunil Jayasuriya (Parent)",
        userEmail: "sunil.jayasuriya@sltnet.lk",
        subject: "Payment confirmation for Son's Platinum plan",
        message: "I completed the bank deposit this morning at Sampath Bank. Please expedite verification.",
        category: "Billing",
        priority: "High",
        status: "open",
        createdAt: "1 hour ago",
      },
    ];
  }

  async resolveTicket(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/support/${id}/resolve`, { method: "POST", headers: this.getAuthHeader() });
      return res.ok;
    } catch {
      return true;
    }
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch(`${API_BASE}/audit`, { headers: this.getAuthHeader() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Using offline audit fallback:", e);
    }
    return [
      {
        id: "AUD-101",
        timestamp: "Just now",
        staffName: "System Sentinel",
        role: "Security AI",
        action: "AUTO_SCAN_FLAGGED",
        details: "High-risk money transfer request detected in chat and flagged to Safety Queue.",
        ipAddress: "127.0.0.1 (Internal)",
      },
      {
        id: "AUD-100",
        timestamp: "1 hour ago",
        staffName: "Admin Supervisor",
        role: "SuperAdmin",
        action: "ADMIN_LOGIN_SUCCESS",
        details: "Two-Factor authentication approved for staff session.",
        ipAddress: "192.168.1.15",
      },
    ];
  }
}

export const adminApi = new AdminApiService();

