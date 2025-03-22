import { RoomStatusEnum } from '../../src/room/types/RoomStatusEnum';
import { PlayerRoleEnum } from '../../src/player/types/PlayerRoleEnum';
import { ExchangeDirectionEnum } from '../../src/exchange/types/ExchangeDirectionEnum';

/**
 * Common test data for user-related tests
 */
export const userData = {
  username: 'testuser',
  password: 'Password123',
  invalidPassword: 'WrongPassword',
  nonExistentUsername: 'nonexistentuser'
};

/**
 * Common test data for room-related tests
 */
export const roomData = {
  name: 'Test Room',
  exchange: 100,
  invalidName: 'A', // Too short
  invalidExchange: -10 // Negative exchange rate
};

/**
 * Common test data for player-related tests
 */
export const playerData = {
  hostName: 'testuser',
  guestName: 'Guest Player',
  hostRole: PlayerRoleEnum.Host,
  playerRole: PlayerRoleEnum.Player
};

/**
 * Common test data for exchange-related tests
 */
export const exchangeData = {
  buyInDirection: ExchangeDirectionEnum.BuyIn,
  cashOutDirection: ExchangeDirectionEnum.CashOut,
  chipAmount: 100,
  invalidChipAmount: -50 // Negative chip amount
};

/**
 * Common test data for room closing
 */
export const roomClosingData = {
  // Balanced player results (sum to 0)
  balancedResults: (hostId: number, guestId: number) => [
    { id: hostId, income: 50 },
    { id: guestId, income: -50 }
  ],
  // Unbalanced player results (don't sum to 0)
  unbalancedResults: (hostId: number, guestId: number) => [
    { id: hostId, income: 100 },
    { id: guestId, income: -50 }
  ]
};
