import { collection, query, orderBy, limit as fbLimit, getDocs, onSnapshot, doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore'
import { db } from './index'

export interface LeaderboardEntry {
  id: string
  name: string
  totalScore: number
  gamesWon: number
  winRate: number
  rank?: number
}

export interface UserData {
  name: string
  email: string
  totalScore: number
  gamesWon: number
  gamesLost: number
  totalGames: number
  winRate: number
  averageScore: number
  bestScore: number
  createdAt?: Date
  updatedAt?: Date
  lastPlayed?: Date
}

export async function getUser(userId: string): Promise<UserData | null> {
  const userDoc = await getDoc(doc(db, 'users', userId))
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as unknown as UserData : null
}

export async function createOrUpdateUser(userId: string, userData: Partial<UserData>): Promise<UserData | null> {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists()) {
    await updateDoc(userRef, { ...userData, updatedAt: serverTimestamp() })
  } else {
    await setDoc(userRef, { ...userData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }
  return getUser(userId)
}

export async function updateUserStats(userId: string, stats: { gameWon: boolean; score: number }): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) throw new Error('User not found')
  const current = userSnap.data() as UserData
  const updateData: any = {
    totalGames: increment(1),
    totalScore: increment(stats.score),
    lastPlayed: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  if (stats.gameWon) {
    updateData.gamesWon = increment(1)
  } else {
    updateData.gamesLost = increment(1)
  }
  if (stats.score > current.bestScore) {
    updateData.bestScore = stats.score
  }
  await updateDoc(userRef, updateData)
  // Recalculate averages
  const updatedUser = await getUser(userId)
  if (updatedUser) {
    const averageScore = updatedUser.totalScore / updatedUser.totalGames
    const winRate = (updatedUser.gamesWon / updatedUser.totalGames) * 100
    await updateDoc(userRef, { averageScore, winRate, updatedAt: serverTimestamp() })
  }
}

export async function getLeaderboard(limitNum = 10): Promise<LeaderboardEntry[]> {
  const q = query(collection(db, 'users'), orderBy('winRate', 'desc'), fbLimit(limitNum))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc, index) => ({ id: doc.id, ...doc.data(), rank: index + 1 } as LeaderboardEntry))
}

export function subscribeToLeaderboard(limitNum = 10, onUpdate: (data: LeaderboardEntry[]) => void, onError: (error: Error) => void) {
  const q = query(collection(db, 'users'), orderBy('winRate', 'desc'), fbLimit(limitNum))
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc, index) => ({ id: doc.id, ...doc.data(), rank: index + 1 } as LeaderboardEntry))
    onUpdate(data)
  }, onError)
}

export async function getUserRank(userId: string): Promise<number | null> {
  const user = await getUser(userId)
  if (!user || user.totalGames === 0) return null
  const q = query(collection(db, 'users'), orderBy('winRate', 'desc'))
  const snapshot = await getDocs(q)
  let rank = 1
  for (const doc of snapshot.docs) {
    if (doc.id === userId) return rank
    rank++
  }
  return null
}

export async function getUsers(userIds: string[]): Promise<UserData[]> {
  const users = await Promise.all(userIds.map(id => getUser(id)))
  return users.filter((user): user is UserData => user !== null)
} 