<template>
  <div class="account-management">
    <!-- Заголовок и кнопка добавления -->
    <div class="header-section">
      <h1 class="main-title">Управление учетными записями</h1>
      <el-button 
        type="primary" 
        :icon="Plus" 
        @click="addNewAccount"
        class="add-button"
      >
        Добавить запись
      </el-button>
    </div>

    <!-- Подсказка для поля метка -->
    <el-alert
      title="Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;"
      type="info"
      :closable="false"
      show-icon
      class="hint-alert"
    />

    <!-- Таблица учетных записей -->
    <div class="table-container">
      <el-table 
        :data="accounts" 
        class="accounts-table"
        :header-cell-style="{ backgroundColor: '#f5f7fa', fontWeight: 'bold' }"
        empty-text="Нет учетных записей"
      >
        <!-- Колонка: Метки -->
        <el-table-column label="Метки" min-width="180">
          <template #default="{ row }">
            <el-input
              v-model="row.labelsString"
              placeholder="xxx"
              maxlength="50"
              @blur="() => handleLabelsUpdate(row)"
              @input="() => updateLabelsPreview(row)"
              class="table-input"
            />
            <!-- Превью меток -->
            <div v-if="row.labelsPreview.length > 0" class="labels-preview">
              <el-tag 
                v-for="(label, index) in row.labelsPreview" 
                :key="index"
                size="small"
                type="info"
              >
                {{ label.text }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- Колонка: Тип записи -->
        <el-table-column label="Тип записи" width="140">
          <template #default="{ row }">
            <el-select
              v-model="row.type"
              @change="() => handleTypeChange(row)"
              class="table-select"
            >
              <el-option label="Локальная" value="Локальная" />
              <el-option label="LDAP" value="LDAP" />
            </el-select>
          </template>
        </el-table-column>

        <!-- Колонка: Логин -->
        <el-table-column label="Логин" min-width="150">
          <template #default="{ row }">
            <el-input
              v-model="row.login"
              placeholder="Значение"
              maxlength="100"
              @blur="() => handleLoginUpdate(row)"
              :class="{ 'error-input': row.errors.login }"
              class="table-input"
            />
            <div v-if="row.errors.login" class="error-text">
              {{ row.errors.login }}
            </div>
          </template>
        </el-table-column>

        <!-- Колонка: Пароль -->
        <el-table-column label="Пароль" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="row.type === 'Локальная'"
              v-model="row.password"
              type="password"
              placeholder="● ● ● ● ● ●"
              maxlength="100"
              show-password
              @blur="() => handlePasswordUpdate(row)"
              :class="{ 'error-input': row.errors.password }"
              class="table-input"
            />
            <span v-else class="password-disabled">—</span>
            <div v-if="row.errors.password" class="error-text">
              {{ row.errors.password }}
            </div>
          </template>
        </el-table-column>

        <!-- Колонка: Действия -->
        <el-table-column label="" width="80" align="center">
          <template #default="{ row }">
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="() => confirmDelete(row.id)"
              class="delete-btn"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { useAccountsStore } from '@/stores/accounts'
import type { Account, Label } from '@/types/account'

// Расширенный интерфейс для строки таблицы
interface TableRow extends Account {
  labelsString: string;
  labelsPreview: Label[];
  errors: {
    login?: string;
    password?: string;
  };
}

const accountsStore = useAccountsStore()

// Преобразование данных для таблицы
const accounts = computed(() => {
  return accountsStore.getAllAccounts.map(account => ({
    ...account,
    labelsString: accountsStore.labelsToString(account.labels),
    labelsPreview: account.labels,
    errors: {}
  } as TableRow))
})

// Методы валидации
const validateLogin = (row: TableRow): boolean => {
  if (!row.login.trim()) {
    row.errors.login = 'Логин обязателен'
    return false
  }
  
  if (row.login.length > 100) {
    row.errors.login = 'Максимум 100 символов'
    return false
  }
  
  // Проверка уникальности
  const duplicate = accounts.value.find(
    acc => acc.id !== row.id && acc.login === row.login
  )
  if (duplicate) {
    row.errors.login = 'Логин уже используется'
    return false
  }
  
  delete row.errors.login
  return true
}

const validatePassword = (row: TableRow): boolean => {
  if (row.type === 'LDAP') {
    delete row.errors.password
    return true
  }
  
  if (!row.password?.trim()) {
    row.errors.password = 'Пароль обязателен'
    return false
  }
  
  if (row.password.length > 100) {
    row.errors.password = 'Максимум 100 символов'
    return false
  }
  
  delete row.errors.password
  return true
}

// Обработчики событий
const addNewAccount = () => {
  accountsStore.addAccount()
  ElMessage.success('Добавлена новая запись')
}

const updateLabelsPreview = (row: TableRow) => {
  row.labelsPreview = accountsStore.parseLabelsString(row.labelsString)
}

const handleLabelsUpdate = (row: TableRow) => {
  const labels = accountsStore.parseLabelsString(row.labelsString)
  accountsStore.updateAccount(row.id, { labels })
}

const handleTypeChange = (row: TableRow) => {
  const updates: Partial<Account> = { type: row.type }
  
  if (row.type === 'LDAP') {
    updates.password = null
    row.password = ''
    delete row.errors.password
  } else {
    updates.password = row.password || ''
  }
  
  accountsStore.updateAccount(row.id, updates)
}

const handleLoginUpdate = (row: TableRow) => {
  if (validateLogin(row)) {
    accountsStore.updateAccount(row.id, { login: row.login })
  }
}

const handlePasswordUpdate = (row: TableRow) => {
  if (validatePassword(row)) {
    accountsStore.updateAccount(row.id, { 
      password: row.type === 'LDAP' ? null : row.password 
    })
  }
}

const confirmDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      'Вы уверены, что хотите удалить эту запись?',
      'Подтверждение удаления',
      {
        confirmButtonText: 'Удалить',
        cancelButtonText: 'Отмена',
        type: 'warning',
      }
    )
    
    accountsStore.deleteAccount(id)
    ElMessage.success('Запись удалена')
  } catch {
    // Отменено пользователем
  }
}

// Инициализация
onMounted(() => {
  accountsStore.loadFromStorage()
})
</script>

<style scoped>
.account-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  min-height: 100vh;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.main-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.add-button {
  border-radius: 4px;
}

.hint-alert {
  margin-bottom: 20px;
}

.table-container {
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.accounts-table {
  width: 100%;
}

.table-input {
  width: 100%;
}

.table-input .el-input__wrapper {
  border-radius: 4px;
  box-shadow: 0 0 0 1px #dcdfe6;
  padding: 8px 12px;
}

.table-select {
  width: 100%;
}

.labels-preview {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.error-input .el-input__wrapper {
  box-shadow: 0 0 0 1px #f56c6c !important;
}

.error-text {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.2;
}

.password-disabled {
  color: #c0c4cc;
  font-style: italic;
  padding: 8px 12px;
  display: inline-block;
}

.delete-btn {
  width: 32px;
  height: 32px;
}

/* Стили для состояний ячеек таблицы */
:deep(.el-table td) {
  padding: 12px 0;
  vertical-align: top;
}

:deep(.el-table th) {
  padding: 16px 0;
  background-color: #f5f7fa !important;
}

:deep(.el-table--border) {
  border: 1px solid #ebeef5;
}

:deep(.el-table--border td) {
  border-right: 1px solid #ebeef5;
}

/* Адаптивность */
@media (max-width: 768px) {
  .account-management {
    padding: 16px;
  }
  
  .header-section {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .accounts-table {
    font-size: 14px;
  }
}
</style>