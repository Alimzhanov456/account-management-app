<template>
  <el-card class="account-item" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="account-id">ID: {{ account.id }}</span>
        <el-button 
          type="danger" 
          :icon="Delete" 
          size="small"
          @click="confirmDelete"
          class="delete-button"
        >
          Удалить
        </el-button>
      </div>
    </template>

    <el-form 
      :model="formData" 
      label-position="top" 
      class="account-form"
      ref="formRef"
    >
      <!-- Поле: Метка -->
      <el-form-item label="Метка (необязательно)" class="form-field">
        <el-input
          v-model="formData.labelsString"
          placeholder="Введите метки через ;"
          maxlength="50"
          show-word-limit
          @blur="handleLabelsBlur"
          @change="handleLabelsChange"
          class="labels-input"
        >
          <template #prefix>
            <el-icon><PriceTag /></el-icon>
          </template>
        </el-input>
        <div v-if="parsedLabels.length > 0" class="labels-preview">
          <el-tag 
            v-for="(label, index) in parsedLabels" 
            :key="index"
            size="small"
            class="label-tag"
          >
            {{ label.text }}
          </el-tag>
        </div>
      </el-form-item>

      <!-- Поле: Тип записи -->
      <el-form-item 
        label="Тип записи" 
        required 
        class="form-field"
      >
        <el-select
          v-model="formData.type"
          placeholder="Выберите тип записи"
          @change="handleTypeChange"
          class="type-select"
        >
          <el-option
            label="Локальная"
            value="Локальная"
          >
            <span>🏠 Локальная</span>
          </el-option>
          <el-option
            label="LDAP"
            value="LDAP"
          >
            <span>🌐 LDAP</span>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- Поле: Логин -->
      <el-form-item 
        label="Логин" 
        required 
        class="form-field"
        :error="validationErrors.login"
      >
        <el-input
          v-model="formData.login"
          placeholder="Введите логин"
          maxlength="100"
          show-word-limit
          @blur="handleLoginBlur"
          @input="clearLoginError"
          :class="{ 'error-input': validationErrors.login }"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- Поле: Пароль (только для типа "Локальная") -->
      <el-form-item 
        v-if="formData.type === 'Локальная'"
        label="Пароль" 
        required 
        class="form-field"
        :error="validationErrors.password"
      >
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="Введите пароль"
          maxlength="100"
          show-word-limit
          show-password
          @blur="handlePasswordBlur"
          @input="clearPasswordError"
          :class="{ 'error-input': validationErrors.password }"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- Статус валидации -->
      <div class="validation-status">
        <el-tag 
          v-if="isFormValid" 
          type="success" 
          size="small"
        >
          ✓ Запись валидна
        </el-tag>
        <el-tag 
          v-else 
          type="warning" 
          size="small"
        >
          ⚠ Заполните обязательные поля
        </el-tag>
      </div>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete, User, Lock, PriceTag } from '@element-plus/icons-vue'
import { useAccountsStore } from '@/stores/accounts'
import type { Account, ValidationErrors, Label } from '@/types/account'

// Props и Events
const props = defineProps<{
  account: Account
}>()

const emit = defineEmits<{
  update: [id: string, updates: Partial<Account>]
  delete: [id: string]
}>()

// Store
const accountsStore = useAccountsStore()

// Реактивные данные формы
const formData = reactive({
  labelsString: accountsStore.labelsToString(props.account.labels),
  type: props.account.type,
  login: props.account.login,
  password: props.account.password || ''
})

// Состояние валидации
const validationErrors = ref<ValidationErrors>({})

// Computed свойства
const parsedLabels = computed<Label[]>(() => {
  return accountsStore.parseLabelsString(formData.labelsString)
})

const isFormValid = computed(() => {
  const hasLogin = formData.login.trim().length > 0
  const hasPassword = formData.type === 'LDAP' || formData.password.trim().length > 0
  const hasNoErrors = Object.keys(validationErrors.value).length === 0
  
  return hasLogin && hasPassword && hasNoErrors
})

// Методы валидации
const validateLogin = (): boolean => {
  if (!formData.login.trim()) {
    validationErrors.value.login = 'Логин обязателен для заполнения'
    return false
  }
  
  if (formData.login.length > 100) {
    validationErrors.value.login = 'Логин не может быть длиннее 100 символов'
    return false
  }
  
  return true
}

const validatePassword = (): boolean => {
  if (formData.type === 'LDAP') {
    return true 
  }
  
  if (!formData.password.trim()) {
    validationErrors.value.password = 'Пароль обязателен для локальной записи'
    return false
  }
  
  if (formData.password.length > 100) {
    validationErrors.value.password = 'Пароль не может быть длиннее 100 символов'
    return false
  }
  
  return true
}

// Очистка ошибок
const clearLoginError = () => {
  if (validationErrors.value.login) {
    delete validationErrors.value.login
  }
}

const clearPasswordError = () => {
  if (validationErrors.value.password) {
    delete validationErrors.value.password
  }
}

// Обработчики событий
const handleLabelsBlur = () => {
  const labels = accountsStore.parseLabelsString(formData.labelsString)
  emitUpdate({ labels })
}

const handleLabelsChange = () => {

}

const handleTypeChange = () => {
  clearPasswordError()
  
  const updates: Partial<Account> = {
    type: formData.type
  }
  
  if (formData.type === 'LDAP') {
    updates.password = null
    formData.password = ''
  } else {
    updates.password = formData.password
  }
  
  emitUpdate(updates)
}

const handleLoginBlur = () => {
  if (validateLogin()) {
    emitUpdate({ login: formData.login })
  }
}

const handlePasswordBlur = () => {
  if (validatePassword()) {
    const password = formData.type === 'LDAP' ? null : formData.password
    emitUpdate({ password })
  }
}

const emitUpdate = (updates: Partial<Account>) => {
  emit('update', props.account.id, updates)
}

const confirmDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `Вы уверены, что хотите удалить учетную запись "${props.account.login || 'Без логина'}"?`,
      'Подтверждение удаления',
      {
        confirmButtonText: 'Удалить',
        cancelButtonText: 'Отмена',
        type: 'warning',
      }
    )
    
    emit('delete', props.account.id)
  } catch {
  }
}

// Watchers для синхронизации с props
watch(() => props.account, (newAccount) => {
  formData.labelsString = accountsStore.labelsToString(newAccount.labels)
  formData.type = newAccount.type
  formData.login = newAccount.login
  formData.password = newAccount.password || ''
}, { deep: true })


watch([() => formData.login, () => formData.password, () => formData.type], () => {
  if (formData.login) validateLogin()
  if (formData.password || formData.type === 'Локальная') validatePassword()
})
</script>

<style scoped>
.account-item {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.account-item:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-id {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.delete-button {
  margin-left: auto;
}

.account-form {
  margin-top: 0;
}

.form-field {
  margin-bottom: 20px;
}

.labels-input {
  margin-bottom: 8px;
}

.labels-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.label-tag {
  margin: 0;
}

.type-select {
  width: 100%;
}

.error-input {
  --el-input-border-color: #f56565;
  --el-input-focus-border-color: #f56565;
}

.validation-status {
  margin-top: 16px;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .delete-button {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>