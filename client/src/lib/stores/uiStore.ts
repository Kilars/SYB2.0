import { makeAutoObservable } from "mobx";

export class UiStore {
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
    }

    isBusy() {
        return this.isLoading = true;
    }

    isIdle() {
        return this.isLoading = false;
    }
}
