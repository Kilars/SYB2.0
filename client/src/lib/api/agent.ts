import axios from "axios";
import { toast } from "react-toastify";
import { router } from "../../app/router/Routes";

const sleep = async (ms: number) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
const agent = axios.create({
    baseURL: '/api'
})

agent.interceptors.response.use(
    async res => {
        await sleep(500);
        return res
    },
    async error => {
        await sleep(500);
        const { status, data } = error.response;
        console.log("error hello", error)
        switch (status) {
            case 400:
                toast.error(data);
                break;
            case 401:
                toast.error('Unauthorized');
                router.navigate('/login');
                break;
            case 403:
                toast.error('Forbidden')
                break;
            case 404:
                toast.error('Not found')
                break;
            case 500:
                router.navigate('/server-error', { state: { error: data } });
                break;
            default:
                break;
        }
        return Promise.reject(error);
    }
);
agent.interceptors.request.use(async res => {
    try {
        return res;

    } catch (error) {
        console.log(error)
        return Promise.reject(error)
    }
})

export default agent;