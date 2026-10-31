import env from "@/env/vars";
import { APIError } from "@/models/api";
import tryCatch from "@/utils/try-catch";
import Cloudflare from "cloudflare";
import { CloudflareTunnel } from "cloudflare/resources";

const cloudflare = new Cloudflare({
  apiToken: env.variables.CLOUDFLARE_ACCOUNT_API_TOKEN,
});

const createTunnel = async ({
  tunnelName,
}: {
  tunnelName: string;
}): Promise<CloudflareTunnel> => {
  const cloudflareTunnel =
    await cloudflare.zeroTrust.tunnels.cloudflared.create({
      account_id: env.variables.CLOUDFLARE_ACCOUNT_ID,
      name: tunnelName,
      config_src: "cloudflare",
    });

  return cloudflareTunnel;
};

const getTunnelToken = ({ tunnelId }: { tunnelId: string }) => {
  return cloudflare.zeroTrust.tunnels.cloudflared.token.get(tunnelId, {
    account_id: env.variables.CLOUDFLARE_ACCOUNT_ID,
  });
};

const deleteTunnel = async ({ tunnelId }: { tunnelId: string }) => {
  return cloudflare.zeroTrust.tunnels.cloudflared.delete(tunnelId, {
    account_id: env.variables.CLOUDFLARE_ACCOUNT_ID,
  });
};

export const cleanupControllerTunnel = async (
  tunnelId: string,
  dnsRecordId: string,
) => {
  await tryCatch(
    cloudflare.dns.records.delete(dnsRecordId, {
      zone_id: env.variables.CLOUDFLARE_ZONE_ID,
    }),
  );
  await tryCatch(deleteTunnel({ tunnelId }));
};

// Keep the database record on failure so removal can be retried. A previous
// attempt may already have removed either resource, so 404 is a success here.
export const removeControllerTunnel = async (
  tunnelId: string,
  dnsRecordId: string,
) => {
  const tunnel = await tryCatch(deleteTunnel({ tunnelId }));
  if (tunnel.error && !(tunnel.error instanceof Cloudflare.NotFoundError)) {
    throw new APIError({
      message:
        "Unable to remove the controller tunnel. Disconnect the Pi and try again.",
      statusCode: 502,
    });
  }
  const dns = await tryCatch(
    cloudflare.dns.records.delete(dnsRecordId, {
      zone_id: env.variables.CLOUDFLARE_ZONE_ID,
    }),
  );
  if (dns.error && !(dns.error instanceof Cloudflare.NotFoundError)) {
    throw new APIError({
      message: "Unable to remove the controller DNS record. Please try again.",
      statusCode: 502,
    });
  }
};

const publishAppService = async ({
  tunnelName,
  cloudflareTunnel,
}: {
  tunnelName: string;
  cloudflareTunnel: CloudflareTunnel;
}): Promise<{
  hostname: string;
  configuration: Cloudflare.ZeroTrust.Tunnels.Cloudflared.Configurations.ConfigurationUpdateResponse;
}> => {
  const hostname = `https://${tunnelName}.nmt-solutions.in`;

  const configuration =
    await cloudflare.zeroTrust.tunnels.cloudflared.configurations.update(
      cloudflareTunnel.id!,
      {
        account_id: env.variables.CLOUDFLARE_ACCOUNT_ID,
        config: {
          ingress: [
            {
              hostname: hostname,
              service: "http://0.0.0.0:8000",
              originRequest: {},
            },
            { hostname: "", service: "http_status:404" },
          ],
        },
      },
      {},
    );

  return { hostname, configuration };
};

const createDNSRecord = async ({
  tunnelName,
  cloudflareTunnel,
}: {
  tunnelName: string;
  cloudflareTunnel: CloudflareTunnel;
}): Promise<Cloudflare.DNS.Records.RecordResponse> => {
  const dns = await cloudflare.dns.records.create({
    zone_id: env.variables.CLOUDFLARE_ZONE_ID,
    type: "CNAME",
    proxied: true,
    name: tunnelName,
    content: `${cloudflareTunnel.id}.cfargotunnel.com`,
    ttl: 1,
  });

  return dns;
};

export const createTunnelAndPublishAppService = async ({
  tunnelName,
}: {
  tunnelName: string;
}) => {
  const { data: cloudflareTunnel, error: tunnelError } = await tryCatch(
    createTunnel({ tunnelName }),
  );

  if (tunnelError) {
    throw new APIError({
      message: "Error occured while creating cloudflare tunnel.",
    });
  }

  const { data: publishedServiceConfig, error: publishError } = await tryCatch(
    publishAppService({ tunnelName, cloudflareTunnel }),
  );

  if (publishError) {
    await tryCatch(deleteTunnel({ tunnelId: cloudflareTunnel.id! }));

    throw new APIError({
      message: "Error occured while publishing cloudflare app service.",
    });
  }

  const { data: dnsRecord, error: dnsRecordError } = await tryCatch(
    createDNSRecord({
      tunnelName,
      cloudflareTunnel,
    }),
  );

  if (dnsRecordError) {
    await tryCatch(deleteTunnel({ tunnelId: cloudflareTunnel.id! }));

    throw new APIError({
      message: "Error occured while creating DNS record.",
    });
  }

  const { data: tunnelToken, error: tokenError } = await tryCatch(
    getTunnelToken({ tunnelId: cloudflareTunnel.id! }),
  );

  if (tokenError) {
    await cleanupControllerTunnel(cloudflareTunnel.id!, dnsRecord.id!);

    throw new APIError({
      message: "Error occured while fetching tunnel token.",
    });
  }

  return {
    tunnelName,
    cloudflareTunnel,
    publishedServiceConfig,
    dnsRecord,
    tunnelToken,
  };
};
