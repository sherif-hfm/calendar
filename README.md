# التقويم الميلادي وتقويم أم القرى

Static web app showing Gregorian and Umm al-Qura (Hijri) calendars side by side.

## Run with Docker

### Build the image

```bash
docker build -t calendar-app .
```

### Run the container

```bash
docker run -d -p 8080:80 calendar-app
```

Open **http://localhost:8080** in your browser.

### Optional: run with a different host port

```bash
docker run -d -p 3000:80 calendar-app
```

Then open **http://localhost:3000**.

### Stop the container

```bash
docker ps
docker stop <container_id>
```

Or stop by name if you ran with `--name`:

```bash
docker run -d -p 8080:80 --name calendar calendar-app
docker stop calendar
```
