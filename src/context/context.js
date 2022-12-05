import React, { useState, useEffect, createContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';


const rootUrl = 'https://api.github.com';

const GithubContext = createContext();


const GithubProvider = ({children}) => {

    const [githubUser, setGithubUser] = useState(mockUser);

    const [repos, setRepos] = useState(mockRepos);

    const [followers, setFollowers] = useState(mockFollowers);

    const [requests, setRequests] = useState(0);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState({show: false, msg: ''});

    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`).then(({data}) => {
            let {rate: {remaining}} = data;
            setRequests(remaining);
            if(remaining === 0) {
                toggleError(true, 'Sorry, you have exceeded your hourly rate limit! ☹️')
            }
        }).catch((error) => console.log(error))
    };

    const searchGithubUser = async (user) => {
        toggleError();
        setLoading(true);
        const response = await axios(`${rootUrl}/users/${user}`).catch((error) => {
            console.log(error);
        });
        if (response) {
            setGithubUser(response.data);

            const {login, followers_url} = response.data;
            // //repos
            // await axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) => {
            //     setRepos(response.data);
            // }).catch((error) => console.log(error));
            // //followers
            // await axios(`${followers_url}?per_page=100`).then((response) => {
            //     setFollowers(response.data);
            // }).catch((error) => console.log(error));   

            await Promise.allSettled([await axios(`${rootUrl}/users/${login}/repos?per_page=100`),
                await axios(`${followers_url}?per_page=100`) 
            ]).then((results) => {
                const [repos, followers] = results;
                const status = 'fulfilled';
                if (repos.status === status) {
                    setRepos(repos.value.data);
                }
                if (followers.status === status) {
                    setFollowers(followers.value.data);
                }
            }).catch((error) => console.log(error));         
        } else {
            toggleError(true, 'Sorry, there is no user with that username');
        }
        checkRequests();
        setLoading(false);
    };

    function toggleError(show = false, msg = '') {
        setError({show, msg});
    };

    useEffect(checkRequests, []); //to prevent the warning errors in the console asking us to input checkRequests as a dependency, we set checkRequests as the callback function in useEffect

    return (

        <GithubContext.Provider value={{
            githubUser,
            repos, 
            followers,
            requests,
            error,
            searchGithubUser,
            loading
        }}>
            {children}
        </GithubContext.Provider>

    );
};

export {GithubContext, GithubProvider};
