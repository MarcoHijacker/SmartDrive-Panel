<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref, computed } from 'vue';
import AppConfig from '@/layout/AppConfig.vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const { layoutConfig } = useLayout();
const email = ref('');
const password = ref('');
const checked = ref(false);
const errorMessage = ref('');
const router = useRouter();

const logoUrl = computed(() => {
    return `/layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});

const validateForm = () => {
    if (!email.value || !password.value) {
        errorMessage.value = 'Email and password are required.';
        return false;
    }
    return true;
};

const login = async () => {
    if (!validateForm()) return;

    try {
        const response = await axios.post('http://localhost:8000/user/login', {
            email: email.value,
            password: password.value,
        });

        if (response.status === 200) {
            localStorage.setItem('jwt', response.data.token);
            router.push('/');
        } else {
            errorMessage.value = 'Login failed. Please try again.';
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            errorMessage.value = 'Invalid email or password.';
        } else {
            errorMessage.value = 'Login failed. Please try again.';
        }
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
                        <div class="text-900 text-3xl font-medium mb-3">Welcome to SmartDrive</div>
                        <span class="text-600 font-medium">Sign in to continue. New user? <a href="/auth/register">Register here!</a></span>
                    </div>

                    <div>
                        <label for="email1" class="block text-900 text-xl font-medium mb-2">Email</label>
                        <InputText id="email1" type="text" placeholder="Email address" class="w-full md:w-30rem mb-5" style="padding: 1rem" v-model="email" />

                        <label for="password1" class="block text-900 font-medium text-xl mb-2">Password</label>
                        <InputText id="password1" type="password" placeholder="Password" class="w-full md:w-30rem mb-5" style="padding: 1rem" v-model="password" />

                        <div class="flex align-items-center justify-content-between mb-5 gap-5">
                            <div class="flex align-items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Remember me</label>
                            </div>
                            <a class="font-medium no-underline ml-2 text-right cursor-pointer" style="color: var(--primary-color)">Forgot password?</a>
                        </div>
                        <Button label="Sign In" class="w-full p-3 text-xl" @click="login"></Button>
                        <div v-if="errorMessage" class="text-red-600 mt-3">{{ errorMessage }}</div>
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
</style>
