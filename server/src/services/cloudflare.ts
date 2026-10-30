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
  const hostname = `${tunnelName}.nmt-solutions.in`;

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
    console.log("[Cloudflare Create Tunnel Error]: ", tunnelError);

    throw new APIError({
      message: "Error occured while creating cloudflare tunnel.",
    });
  }

  const { data: publishedServiceConfig, error: publishError } = await tryCatch(
    publishAppService({ tunnelName, cloudflareTunnel }),
  );

  if (publishError) {
    console.log("[Cloudflare Publish App Service Error]: ", publishError);

    const { error } = await tryCatch(
      deleteTunnel({ tunnelId: cloudflareTunnel.id! }),
    );

    console.log("[Cloudflare Delete Tunnel Error]: ", error);

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
    console.log("[Cloudflare Create DNS Record Error]: ", dnsRecordError);

    const { error } = await tryCatch(
      deleteTunnel({ tunnelId: cloudflareTunnel.id! }),
    );

    console.log("[Cloudflare Delete Tunnel Error]: ", error);

    throw new APIError({
      message: "Error occured while creating DNS record.",
    });
  }

  const { data: tunnelToken, error: tokenError } = await tryCatch(
    getTunnelToken({ tunnelId: cloudflareTunnel.id! }),
  );

  if (tokenError) {
    console.log("[Cloudflare Get Tunnel Token Error]: ", tokenError);

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
