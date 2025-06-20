import axios from "axios";

const sleep = async (ms: number) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
const agent = axios.create({
    baseURL: '/api'
})

agent.interceptors.request.use(async res => {
    try {
        await sleep(500);
        return res;

    } catch (error) {
        console.log(error)
        return Promise.reject(error)
    }
})

export default agent;