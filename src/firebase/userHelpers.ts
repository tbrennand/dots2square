import { db } from '@/firebase/index'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  where
} from 'firebase/firestore'

export interface User {
  id: string
  name: string
  email?: string
  totalGames: number
  gamesWon: number
  gamesLost: number
  totalScore: number
  bestScore: number
  averageScore: number
  winRate: number
  lastPlayed: Date
  createdAt: Date
  updatedAt: Date
}

export interface LeaderboardEntry {
  id: string
  name: string
  totalScore: number
  gamesWon: number
  winRate: number
  rank: number
}

export interface CreateUserData {
  name: string
  email?: string
}

export interface UpdateUserStatsData {
  gameWon?: boolean
  score?: number
}

/**
 * Create or update a user in the users collection
 */
export async function createOrUpdateUser(userId: string, userData: CreateUserData): Promise<User> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        name: userData.name,
        email: userData.email,
        updatedAt: serverTimestamp()
      })
      
      const updatedDoc = await getDoc(userRef)
      return {
        id: userId,
        ...updatedDoc.data()
      } as User
    } else {
      // Create new user
      const newUser: Omit<User, 'id'> = {
        name: userData.name,
        email: userData.email,
        totalGames: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalScore: 0,
        bestScore: 0,
        averageScore: 0,
        winRate: 0,
        lastPlayed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastPlayed: serverTimestamp()
      })

      return {
        id: userId,
        ...newUser
      }
    }
  } catch (error) {
    console.error('Error creating/updating user:', error)
    throw new Error('Failed to create or update user')
  }
}

/**
 * Get a user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        id: userId,
        ...data,
        lastPlayed: data.lastPlayed?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as User
    }

    return null
  } catch (error) {
    console.error('Error getting user:', error)
    throw new Error('Failed to get user')
  }
}

/**
 * Update user stats after a game
 */
export async function updateUserStats(userId: string, stats: UpdateUserStatsData): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error('User not found')
    }

    const userData = userDoc.data() as User
    const updates: any = {
      totalGames: increment(1),
      lastPlayed: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    if (stats.gameWon !== undefined) {
      if (stats.gameWon) {
        updates.gamesWon = increment(1)
      } else {
        updates.gamesLost = increment(1)
      }
    }

    if (stats.score !== undefined) {
      updates.totalScore = increment(stats.score)
      
      // Update best score if current score is higher
      if (stats.score > userData.bestScore) {
        updates.bestScore = stats.score
      }
    }

    await updateDoc(userRef, updates)

    // Update calculated fields
    const updatedDoc = await getDoc(userRef)
    const updatedData = updatedDoc.data() as User
    
    const totalGames = updatedData.totalGames
    const gamesWon = updatedData.gamesWon
    const totalScore = updatedData.totalScore
    
    const calculatedUpdates = {
      winRate: totalGames > 0 ? (gamesWon / totalGames) * 100 : 0,
      averageScore: totalGames > 0 ? totalScore / totalGames : 0
    }

    await updateDoc(userRef, calculatedUpdates)
  } catch (error) {
    console.error('Error updating user stats:', error)
    throw new Error('Failed to update user stats')
  }
}

/**
 * Get the top players for the leaderboard
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const usersRef = collection(db, 'users')
    const leaderboardQuery = query(
      usersRef,
      where('totalGames', '>', 0), // Only include users who have played games
      orderBy('totalGames', 'desc'),
      orderBy('totalScore', 'desc'),
      limit(limit)
    )

    const snapshot = await getDocs(leaderboardQuery)
    const leaderboard: LeaderboardEntry[] = []

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data() as User
      leaderboard.push({
        id: doc.id,
        name: data.name,
        totalScore: data.totalScore,
        gamesWon: data.gamesWon,
        winRate: data.winRate,
        rank: index + 1
      })
    })

    return leaderboard
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    throw new Error('Failed to get leaderboard')
  }
}

/**
 * Subscribe to leaderboard updates in real-time
 */
export function subscribeToLeaderboard(
  limit: number = 10,
  callback: (leaderboard: LeaderboardEntry[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const usersRef = collection(db, 'users')
    const leaderboardQuery = query(
      usersRef,
      where('totalGames', '>', 0),
      orderBy('totalGames', 'desc'),
      orderBy('totalScore', 'desc'),
      limit(limit)
    )

    const unsubscribe = onSnapshot(
      leaderboardQuery,
      (snapshot) => {
        const leaderboard: LeaderboardEntry[] = []

        snapshot.docs.forEach((doc, index) => {
          const data = doc.data() as User
          leaderboard.push({
            id: doc.id,
            name: data.name,
            totalScore: data.totalScore,
            gamesWon: data.gamesWon,
            winRate: data.winRate,
            rank: index + 1
          })
        })

        callback(leaderboard)
      },
      (error) => {
        console.error('Error listening to leaderboard:', error)
        if (onError) {
          onError(new Error('Failed to load leaderboard'))
        }
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('Error setting up leaderboard subscription:', error)
    if (onError) {
      onError(new Error('Failed to connect to leaderboard'))
    }
    return () => {}
  }
}

/**
 * Get user's rank in the leaderboard
 */
export async function getUserRank(userId: string): Promise<number | null> {
  try {
    const user = await getUser(userId)
    if (!user || user.totalGames === 0) {
      return null
    }

    const usersRef = collection(db, 'users')
    const rankQuery = query(
      usersRef,
      where('totalGames', '>', 0),
      orderBy('totalGames', 'desc'),
      orderBy('totalScore', 'desc')
    )

    const snapshot = await getDocs(rankQuery)
    let rank = 0

    for (const doc of snapshot.docs) {
      rank++
      if (doc.id === userId) {
        return rank
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user rank:', error)
    throw new Error('Failed to get user rank')
  }
}

/**
 * Get multiple users by IDs
 */
export async function getUsers(userIds: string[]): Promise<User[]> {
  try {
    const users: User[] = []
    
    for (const userId of userIds) {
      const user = await getUser(userId)
      if (user) {
        users.push(user)
      }
    }

    return users
  } catch (error) {
    console.error('Error getting users:', error)
    throw new Error('Failed to get users')
  }
} 