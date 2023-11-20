import { useCallback, useLayoutEffect } from "react"

import IndexedDBWrapper from "./indexed-db-wrapper";
const DB_NAME = "gpt.tracker";
const DB_STORE_NAME = "events";

const useBulkTrackEvents = (handleEventSubmit, isLoading = false,
    logRate = 5000) => {
    const db = new IndexedDBWrapper(DB_NAME, 1, (event) => {
        const objectStore = event.target.result.createObjectStore(DB_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
        });
        objectStore.createIndex("metadata", "metadata", { unique: false });
        objectStore.createIndex("provider", "provider", { unique: false });
        objectStore.createIndex("log", "log", { unique: false });
    });


    const sendEvents = () => {
        if (isLoading) {
            return;
        }
        db.popAll(DB_STORE_NAME).then((events) => {
            if (events.length > 0) {
                handleBehaviorsSubmit(events);
            }
        });
    };

    const handleBehaviorsSubmit = useCallback(
        (events) => {
            handleEventSubmit(events);
        },
        [handleEventSubmit]
    );

    const cacheEvent = useCallback(({ provider, metadata, event }) => {
        const eventData = {
            provider, metadata, event
        };

        db.add(DB_STORE_NAME, [eventData]);

    }, []);

    useLayoutEffect(() => {

        window.addEventListener("beforeunload", sendEvents);

        const timer = setInterval(sendEvents, logRate);
        return () => {
            window.removeEventListener("beforeunload", sendEvents);
            clearInterval(timer);
        }
    });

    return {
        cacheEvent
    }
}

export default useBulkTrackEvents;