import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import walletReducer from './walletSlice';
import challengeReducer from './challengeSlice';

const persistConfig = { key: 'root', storage: AsyncStorage, whitelist: ['wallet'] };

const rootReducer = combineReducers({
  wallet: walletReducer,
  challenge: challengeReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (g) => g({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
