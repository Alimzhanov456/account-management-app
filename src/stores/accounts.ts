import { defineStore } from 'pinia'
import type { Account, Label, AccountType } from '@/types/account'

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    accounts: [] as Account[],
    nextId: 1
  }),

  getters: {
    getAllAccounts: (state) => state.accounts,
    
    getAccountsCount: (state) => state.accounts.length
  },

  actions: {
    // Добавление новой пустой учетной записи
    addAccount() {
      const newAccount: Account = {
        id: `account_${this.nextId}`,
        labels: [],
        type: 'Локальная', 
        login: '',
        password: ''
      }
      
      this.accounts.push(newAccount)
      this.nextId++
      
      // Автосохранение в localStorage
      this.saveToStorage()
      
      console.log('Добавлена новая учетная запись:', newAccount.id)
    },

    // Обновление существующей учетной записи
    updateAccount(id: string, updates: Partial<Account>) {
      const index = this.accounts.findIndex(acc => acc.id === id)
      
      if (index !== -1) {
        if (updates.type === 'LDAP') {
          updates.password = null
        }
        
        this.accounts[index] = { 
          ...this.accounts[index], 
          ...updates 
        }
        
        this.saveToStorage()
        
        console.log(`Обновлена учетная запись ${id}:`, updates)
      }
    },

    // Удаление учетной записи
    deleteAccount(id: string) {
      const index = this.accounts.findIndex(acc => acc.id === id)
      
      if (index !== -1) {
        this.accounts.splice(index, 1)

        this.saveToStorage()
        
        console.log('Удалена учетная запись:', id)
      }
    },

    parseLabelsString(labelsString: string): Label[] {
      if (!labelsString.trim()) {
        return []
      }
      
      return labelsString
        .split(';')
        .map(text => text.trim())
        .filter(text => text.length > 0)
        .map(text => ({ text }))
    },

    // Преобразование массива меток в строку
    labelsToString(labels: Label[]): string {
      return labels.map(label => label.text).join(';')
    },

    // Сохранение в localStorage
    saveToStorage() {
      try {
        const dataToSave = {
          accounts: this.accounts,
          nextId: this.nextId
        }
        localStorage.setItem('account-management-data', JSON.stringify(dataToSave))
        console.log('Данные сохранены в localStorage')
      } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error)
      }
    },

    // Загрузка из localStorage
    loadFromStorage() {
      try {
        const savedData = localStorage.getItem('account-management-data')
        
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          this.accounts = parsedData.accounts || []
          this.nextId = parsedData.nextId || 1
          
          console.log('Данные загружены из localStorage:', this.accounts.length, 'записей')
        }
      } catch (error) {
        console.error('Ошибка загрузки из localStorage:', error)
        this.accounts = []
        this.nextId = 1
      }
    },

    // Очистка всех данных (для отладки)
    clearAllData() {
      this.accounts = []
      this.nextId = 1
      localStorage.removeItem('account-management-data')
      console.log('Все данные очищены')
    }
  }
})