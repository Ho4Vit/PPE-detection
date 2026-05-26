package ppe.ppedetectuser.repositories;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ppe.ppedetectuser.entities.Users;

import java.util.Optional;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByEmail(String email);

    Optional<Users> findByGoogleId(String googleId);

    Boolean existsByEmail(String email);
}