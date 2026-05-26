package ppe.ppedetectuser.config.authentication;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final StringRedisTemplate redisTemplate;
    private static final String BLACKLIST_PREFIX = "blacklist:";
    private static final String REFRESH_PREFIX = "refresh:";

    public void blacklist(String token, long ttlMillis) {
        redisTemplate.opsForValue()
                .set(BLACKLIST_PREFIX + token, "true", ttlMillis, TimeUnit.MILLISECONDS);
    }

    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    }

    public void saveRefreshToken(String userId, String refreshToken, long ttlMillis) {
        redisTemplate.opsForValue()
                .set(REFRESH_PREFIX + userId, refreshToken, ttlMillis, TimeUnit.MILLISECONDS);
    }

    public String getRefreshToken(String userId) {
        return redisTemplate.opsForValue().get(REFRESH_PREFIX + userId);
    }

    public void deleteRefreshToken(String userId) {
        redisTemplate.delete(REFRESH_PREFIX + userId);
    }
}