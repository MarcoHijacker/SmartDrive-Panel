<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref, computed } from 'vue';
import AppConfig from '@/layout/AppConfig.vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const { layoutConfig } = useLayout();
const name = ref('');
const surname = ref('');
const email = ref('');
const password = ref('');
const deviceId = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const router = useRouter();

const logoUrl = computed(() => {
    return `/layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});

const validateForm = () => {
    if (!name.value || !surname.value || !email.value || !password.value || !deviceId.value) {
        errorMessage.value = 'All fields are required.';
        return false;
    }
    return true;
};

const register = async () => {
    if (!validateForm()) return;

    try {
        const response = await axios.post('http://localhost:8000/user/new_user', {
            name: name.value,
            surname: surname.value,
            email: email.value,
            password: password.value,
            device_id: deviceId.value,
        });

        if (response.status === 201) {
            successMessage.value = 'Registration successful! Redirecting to login page...';
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000); // Redirect after 2 seconds
        }
    } catch (error) {
        errorMessage.value = 'Registration failed. Please try again.';
    }
};
</script>

<template>
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <img :src="logoUrl" alt="Sakai logo" class="mb-5 w-6rem flex-shrink-0" />
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                    <div class="text-center mb-5">
                        <div class="text-900 text-3xl font-medium mb-3">Register to SmartDrive</div>
                        <span class="text-600 font-medium">Already have an account? <a href="/auth/login">Login here!</a></span>
                    </div>
                    <div>
                        <label for="name" class="block text-900 text-xl font-medium mb-2">Name</label>
                        <InputText id="name" type="text" placeholder="Name" class="w-full md:w-30rem mb-3" style="padding: 1rem" v-model="name" />

                        <label for="surname" class="block text-900 text-xl font-medium mb-2">Surname</label>
                        <InputText id="surname" type="text" placeholder="Surname" class="w-full md:w-30rem mb-3" style="padding: 1rem" v-model="surname" />

                        <label for="email1" class="block text-900 text-xl font-medium mb-2">Email</label>
                        <InputText id="email1" type="email" placeholder="Email address" class="w-full md:w-30rem mb-5" style="padding: 1rem" v-model="email" />

                        <label for="password1" class="block text-900 font-medium text-xl mb-2">Password</label>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="w-full mb-3" inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>

                        <label for="device_id" class="block text-900 text-xl font-medium mb-2">Device ID</label>
                        <InputText id="device_id" type="text" placeholder="Device ID" class="w-full md:w-30rem mb-5" style="padding: 1rem" v-model="deviceId" />

                        <div v-if="errorMessage" class="text-red-600 mb-3">{{ errorMessage }}</div>
                        <div v-if="successMessage" class="text-green-600 mb-3">{{ successMessage }}</div>

                        <div>
                            <Button label="Register" class="w-full d-block p-3 text-xl" @click="register"></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <AppConfig simple />
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}

.p-password {
    width: 420px !important;
}
</style>