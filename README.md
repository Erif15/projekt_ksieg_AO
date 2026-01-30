# BookNest – podręczna biblioteka (CRUD)

Projekt zaliczeniowy - BookNest
Aplikacja typu CRUD w React Native (Expo) + własne REST API (Node/Express) + baza w pliku (lowdb).

## Funkcje (CRUD + pola książki)
- GET lista książek
- GET szczegóły książki
- POST dodanie książki
- PUT/PATCH aktualizacja książki
- DELETE usuwanie książki

Model książki: tytuł, autor, opis, ocena, (okładka – mock), (ulubione).

## Struktura repo
- /api – REST API (Express + lowdb, zapis do api/data/db.json)
- /mobile – aplikacja mobilna (Expo / React Native)
- /docs – dokumentacja końcowa (API, funkcja natywna, screeny)

## Uruchomienie

### API
```bash
cd api
npm install
npm run dev
