<template>
  <div id="app">
    <AccountForm />
  </div>
</template>

<script setup lang="ts">
import AccountForm from './components/AccountForm.vue'
</script>

<style>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.el-card {
  --el-card-border-radius: 8px;
}

.el-button {
  border-radius: 6px;
}

.el-input__wrapper {
  border-radius: 6px;
}

.el-select .el-input__wrapper {
  border-radius: 6px;
}

.account-item-wrapper {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Отзывчивость */
@media (max-width: 768px) {
  .account-form {
    padding: 16px;
  }
  
  .form-header {
    padding: 16px;
  }
  
  .main-title {
    font-size: 24px;
  }
}
</style>