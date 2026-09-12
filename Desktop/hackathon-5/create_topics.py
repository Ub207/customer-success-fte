import asyncio
import os
import ssl
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path("production/.env"))

from aiokafka.admin import AIOKafkaAdminClient, NewTopic

TOPICS = [
    "fte.gmail.inbound",
    "fte.whatsapp.inbound",
    "fte.webform.inbound",
    "fte.escalations",
    "fte.metrics",
    "fte.dlq",
    "fte.channels.email.outbound",
    "fte.channels.whatsapp.outbound",
    "fte.agent.responses",
]

async def main():
    ssl_ctx = ssl.create_default_context()
    admin = AIOKafkaAdminClient(
        bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
        security_protocol=os.getenv("KAFKA_SECURITY_PROTOCOL", "SASL_SSL"),
        sasl_mechanism=os.getenv("KAFKA_SASL_MECHANISM", "SCRAM-SHA-256"),
        sasl_plain_username=os.getenv("KAFKA_SASL_USERNAME"),
        sasl_plain_password=os.getenv("KAFKA_SASL_PASSWORD"),
        ssl_context=ssl_ctx,
    )
    await admin.start()

    new_topics = [NewTopic(t, num_partitions=1, replication_factor=1) for t in TOPICS]

    try:
        await admin.create_topics(new_topics)
        print("Topics created successfully!")
    except Exception as e:
        print(f"Note: {e}")

    await admin.close()
    print("Done!")

asyncio.run(main())
