<template>
    <div class="grid p-fluid">
      <!-- User Profile Section -->
      <div class="col-12">
        <div class="card">
          <h5 class="mb-4">
            <i class="pi pi-user-edit mr-2"></i>
            <span>User Profile</span>
          </h5>
          <div class="grid formgrid">
            <div class="col-12 md:col-6 mb-3">
              <label for="userName" class="block my-2">Name</label>
              <InputText id="userName" v-model="user.name" placeholder="User Name" />
            </div>
            <div class="col-12 md:col-6 mb-3">
              <label for="userSurname" class="block my-2">Surname</label>
              <InputText id="userSurname" v-model="user.surname" placeholder="Surname" />
            </div>
            <div class="col-12 md:col-6 mb-3">
              <label for="userEmail" class="block my-2">E-mail</label>
              <InputText id="userEmail" v-model="user.email" placeholder="Email" />
            </div>
            <div class="col-12 md:col-6 mb-3">
              <label for="userDeviceId" class="block my-2">Device ID</label>
              <InputText id="userDeviceId" v-model="user.device_id" placeholder="Device ID" />
            </div>
            <div class="col-12 my-3 flex align-items-center">
              <Button label="Update Profile" icon="pi pi-check" @click="updateUserProfile" />
              <Button icon="pi pi-trash" class="ml-2 p-button-danger" @click="confirmDeleteUser" />
            </div>
          </div>
        </div>
      </div>
  
      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog></ConfirmDialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import { useConfirm } from 'primevue/useconfirm';
  import InputText from 'primevue/inputtext';
  import Button from 'primevue/button';
  import ConfirmDialog from 'primevue/confirmdialog';
  import axios from 'axios';
  import { useRouter } from 'vue-router';
  
  const token = localStorage.getItem('jwt');
  const userId = JSON.parse(atob(token.split('.')[1])).user_id;
  
  const user = ref({
    name: '',
    surname: '',
    email: '',
    device_id: ''
  });
  const formSubmitted = ref(false);
  
  const toast = useToast();
  const confirmPopup = useConfirm();
  const router = useRouter();
  
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      user.value = response.data;
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch user profile', life: 3000 });
    }
  };
  
  const updateUserProfile = async () => {
    formSubmitted.value = true;
    try {
      await axios.patch(`http://localhost:8000/user/modify`, user.value, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.add({ severity: 'success', summary: 'Success', detail: 'Profile updated', life: 3000 });
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile', life: 3000 });
    }
  };
  
  const confirmDeleteUser = () => {
    confirmPopup.require({
      message: 'Are you sure you want to delete your profile?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      accept: deleteUser
    });
  };
  
  const deleteUser = async () => {
    try {
      await axios.delete(`http://localhost:8000/user/delete`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      localStorage.removeItem('jwt'); // Erase jwt from localStorage
      toast.add({ severity: 'success', summary: 'Deleted', detail: 'Profile deleted', life: 3000 });
      router.push('/auth/register'); // Redirect to registration page
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete profile', life: 3000 });
    }
  };
  
  onMounted(() => {
    fetchUserProfile();
  });
  </script>
  
  <style scoped>
  .p-error {
    color: red;
  }
  </style>  