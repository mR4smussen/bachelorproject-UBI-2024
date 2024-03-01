function stream_data(data, chunk_size, canvas, draw_callback) {
    let index = 0;
    isPaused = false

    const next_chunk = () => {
        if (index < data.length && !isPaused) {
            const chunk = data.slice(index, index + chunk_size)
            setTimeout(() => {
                chunk.forEach(node => {
                    try {
                        const object = JSON.parse(node);
                        draw_callback(object, canvas);
                    } catch (error) {
                        console.error('Error parsing or drawing:', error);
                        return 
                    }
                })
                index += chunk_size
            next_chunk()
            }, 0)
        }
    }

    next_chunk()

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            isPaused = !isPaused;
            if (!isPaused) {
                next_chunk();
            }
        }
    });
}