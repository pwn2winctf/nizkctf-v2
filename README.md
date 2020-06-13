```sh
curl -X POST -H "Content-Type: application/json" http://localhost:8080/users -d '{"email":"<email>@mailinator.com", "password":"<password>", "displayName":"<name>"}'
```

```sh
curl -X POST -H "Content-Type: application/json" http://localhost:8080/users/login -d '{"email":"<email>@mailinator.com", "password":"<password>"}'
```

```sh
curl -X POST -H "Content-Type: application/json" -H "Authorization: <token>" http://localhost:8080/teams -d '{"name":"Tester", "countries":["br"]}'
```

```sh
curl -X POST -H "Content-Type: application/json" -H "Authorization: <token>" http://localhost:8080/teams/lOu6TrJTAw6MgZIK8F1X/solves -d '{"challengeId":"test", "proof":"lQweQFjTMw+G7OldCOD47S5XnkuRaFqMhcIv71B/PvTsEIonFJnjJmMf6kHRAXDTxzGgy3xZmrBuWDczZFn2BTllN2NkOWNiNWE2M2EzNTkxZTE2ZjRkODM1ZjMyYTFjNGE4NGFiNjZlMzlhZTI3YWE0NDhjMDNiNjZiZjYzZTc="}'
```
