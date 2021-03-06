import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { StateService } from './state.service';
import { Router } from '@angular/router';
import { AppState } from '../models/state.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject } from 'rxjs';

const helper = new JwtHelperService();

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
        private router: Router,
        private http: HttpClient,
        private state: StateService,
    ) {}

    async isAuthenticated(): Promise<boolean> {
        const currentState = await this.state.get();
        let isLoggedIn = false;
        // make sure token and user exist in state
        if (
            currentState ||
            currentState.currentUser ||
            currentState.currentUser.token
        ) {
            // use the jwt helper to see if the current token is expired
            const isTokenExpired = await helper.isTokenExpired(
                currentState.currentUser.token,
            );
            // return false if token is expired
            // otherwise user is authenticated
            isLoggedIn = isTokenExpired === true ? false : true;
        }
        this.isLoggedIn.next(isLoggedIn);
        // if theres no authenticated user
        // redirect to the login page
        if (!isLoggedIn) {
            this.router.navigate(['login']);
        }
        return isLoggedIn;
    }

    async login(username, password) {
        // make login request to backend
        const requestUrl = `${environment.apiUrl}/auth/login`;
        const requestBody = {
            username,
            password,
        };
        const loginRequest = await this.http
            .post<any>(requestUrl, requestBody)
            .toPromise();

        // don't do anything if it failed
        if (!loginRequest) {
            return;
        }
        // update state and view if successfull
        this.isLoggedIn.next(true);
        this.state.set({ currentUser: { ...loginRequest } });
        this.router.navigateByUrl(`/${loginRequest.username}`);
    }

    async logout() {
        const newState: AppState = {
            currentUser: {
                id: null,
                firstName: null,
                lastName: null,
                username: null,
                email: null,
                role: null,
                createdAt: null,
                updatedAt: null,
                datasets: null,
                token: null,
            },
        };
        this.state.set({ ...newState });
        this.isLoggedIn.next(false);
        this.router.navigate([`/login`]);
    }
}
